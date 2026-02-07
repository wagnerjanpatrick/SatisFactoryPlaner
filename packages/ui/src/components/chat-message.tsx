"use client";

import {
  AlertTriangle,
  Ban,
  ChevronDown,
  Clock,
  FileText,
  ImageIcon,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Shield,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Input } from "./input";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

interface User {
  id: string;
  username: string;
  isTeamMember: boolean;
  isAdmin?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: "user" | "system" | "tool";
  toolType?: "mapban" | "timeout" | "warning";
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

interface LinkPreview {
  url: string;
  favicon?: string;
  title?: string;
  cleanUrl: string;
}

interface MatchChatProps {
  teamMembers: User[];
  currentUserId: string;
  onToolMessage?: (
    toolType: "mapban" | "timeout" | "warning",
    content: string
  ) => void;
}

const MOCK_USERS: User[] = [
  { id: "1", username: "player1", isTeamMember: true },
  { id: "2", username: "player2", isTeamMember: true },
  { id: "3", username: "admin", isTeamMember: false, isAdmin: true },
  { id: "4", username: "moderator", isTeamMember: false },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    userId: "3",
    content: "Welcome to the match! Good luck to both teams.",
    timestamp: new Date(Date.now() - 300_000),
    type: "user",
  },
  {
    id: "2",
    userId: "1",
    content: "Thanks! Ready to play. <@2> are you ready?",
    timestamp: new Date(Date.now() - 240_000),
    type: "user",
  },
  {
    id: "3",
    userId: "system",
    content: "Map **Dust2** has been banned by the admin.",
    timestamp: new Date(Date.now() - 180_000),
    type: "tool",
    toolType: "mapban",
  },
];

export function MatchChat({
  teamMembers = MOCK_USERS,
  currentUserId = "1",
  onToolMessage,
}: MatchChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [linkPreviews, setLinkPreviews] = useState<Map<string, LinkPreview>>(
    new Map()
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserTag = (userId: string) => {
    if (userId === "system") return "[Strave]";

    const user = teamMembers.find((u) => u.id === userId);
    if (!user) return "[Strave]";

    if (user.isAdmin) return "[Admin]";
    if (user.isTeamMember) return "[Team]";
    return "[Strave]";
  };

  const getUserName = (userId: string) => {
    if (userId === "system") return "System";
    const user = teamMembers.find((u) => u.id === userId);
    return user?.username || "Unknown";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;

    const transformedValue = value.replace(/<@(\w+)>/g, (match, userId) => {
      const user = teamMembers.find((u) => u.id === userId);
      return user ? `@${user.username}` : match;
    });

    setInputValue(transformedValue);
    setCursorPosition(position);

    // Check for @ mention
    const beforeCursor = transformedValue.slice(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]!);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (user: User) => {
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const afterCursor = inputValue.slice(cursorPosition);
    const beforeMention = beforeCursor.replace(/@\w*$/, "");

    const newValue = `${beforeMention}@${user.username}${afterCursor}`;
    setInputValue(newValue);
    setShowSuggestions(false);
    setMentionQuery("");

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = beforeMention.length + `@${user.username}`.length;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const renderMessageContent = (message: ChatMessage) => {
    const processedContent = message.content.replace(
      /<@(\w+)>/g,
      (match, userId) => {
        const user = teamMembers.find((u) => u.id === userId);
        return user ? `**@${user.username}**` : match;
      }
    );

    return (
      <div>
        <div className="prose prose-sm max-w-none [&>*]:my-0">
          <div className="whitespace-pre-wrap">
            {processedContent
              .split(/(https?:\/\/[^\s]+)/g)
              .map((part, index) => {
                if (part.match(/^https?:\/\//)) {
                  // This is a URL - clean it and display as normal link
                  const cleanedUrl = cleanUrl(part);
                  return (
                    <a
                      className="text-current underline underline-offset-2 hover:opacity-80"
                      href={cleanedUrl}
                      key={index}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {cleanedUrl}
                    </a>
                  );
                }
                // This is regular text, process markdown
                return (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: part
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                    key={index}
                  />
                );
              })}
          </div>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2">
            <div
              className={cn(
                "gap-2",
                message.attachments.length === 1 ? "flex" : "grid grid-cols-2"
              )}
            >
              {message.attachments.map((attachment, index) => (
                <div key={index}>
                  {attachment.type.startsWith("image/") ? (
                    <div
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => setSelectedImage(attachment.url)}
                    >
                      <img
                        alt={attachment.name}
                        className="max-h-32 w-full max-w-32 rounded border object-cover"
                        src={attachment.url || "/placeholder.svg"}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded border bg-background/50 p-2 text-xs transition-colors hover:bg-background/70"
                      onClick={() => handleFileDownload(attachment)}
                    >
                      {getFileIcon(attachment.type)}
                      <span className="flex-1 truncate">
                        {truncateFilename(attachment.name, 15)}
                      </span>
                      <span className="text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)}KB
                      </span>
                      <Button
                        className="h-5 w-5 p-0 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDownload(attachment);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    let processedContent = inputValue;
    teamMembers.forEach((user) => {
      const regex = new RegExp(`@${user.username}\\b`, "g");
      processedContent = processedContent.replace(regex, `<@${user.id}>`);
    });

    const messageAttachments = await Promise.all(
      attachments.map(async (file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size,
      }))
    );

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      content: processedContent,
      timestamp: new Date(),
      type: "user",
      attachments:
        messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setAttachments([]);
    setShowSuggestions(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/svg+xml",
        "application/pdf",
        "text/plain",
      ];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileDownload = (attachment: {
    name: string;
    url: string;
    type: string;
  }) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-3 w-3" />;
    if (type === "application/pdf") return <FileText className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  const truncateFilename = (filename: string, maxLength = 8) => {
    if (filename.length <= maxLength) return filename;

    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return filename.slice(0, maxLength - 3) + "...";
    }

    const extension = filename.slice(lastDotIndex);
    const nameWithoutExt = filename.slice(0, lastDotIndex);
    const availableLength = maxLength - extension.length - 3; // 3 for "..."

    if (availableLength <= 0) return extension;

    return nameWithoutExt.slice(0, availableLength) + "..." + extension;
  };

  const addToolMessage = (
    toolType: "mapban" | "timeout" | "warning",
    content: string
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: "system",
      content,
      timestamp: new Date(),
      type: "tool",
      toolType,
    };
    setMessages((prev) => [...prev, newMessage]);
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const addTestMessage = (userId: string, content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId,
      content,
      timestamp: new Date(),
      type: "user",
    };
    setMessages((prev) => [...prev, newMessage]);
    if (!isOpen && userId !== currentUserId) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    (window as any).addChatToolMessage = addToolMessage;
    (window as any).addChatTestMessage = addTestMessage;
  }, []); // Empty dependency array to run only once on mount

  const filteredUsers = teamMembers.filter((user) =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const renderToolMessage = (message: ChatMessage) => {
    const getToolIcon = () => {
      switch (message.toolType) {
        case "mapban":
          return <Ban className="size-4 text-orange-500" />;
        case "timeout":
          return <Clock className="size-4 text-blue-500" />;
        case "warning":
          return <AlertTriangle className="size-4 text-red-500" />;
        default:
          return <Shield className="size-4 text-gray-500" />;
      }
    };

    const getToolTitle = () => {
      switch (message.toolType) {
        case "mapban":
          return "Map Ban Executed";
        case "timeout":
          return "Player Timeout";
        case "warning":
          return "Warning Issued";
        default:
          return "System Action";
      }
    };

    const getToolDetails = () => {
      const details = [];

      if (message.toolType === "mapban") {
        details.push(
          <TaskItem key="action">
            <span className="inline-flex items-center gap-1">
              Banned map
              <TaskItemFile>
                <Ban className="size-3" />
                <span>Dust2</span>
              </TaskItemFile>
            </span>
          </TaskItem>
        );
        details.push(
          <TaskItem key="admin">Action performed by Admin</TaskItem>
        );
      } else if (message.toolType === "timeout") {
        details.push(
          <TaskItem key="action">
            <span className="inline-flex items-center gap-1">
              Applied timeout to
              <TaskItemFile>
                <Clock className="size-3" />
                <span>player1</span>
              </TaskItemFile>
            </span>
          </TaskItem>
        );
        details.push(<TaskItem key="duration">Duration: 30 seconds</TaskItem>);
      } else if (message.toolType === "warning") {
        details.push(
          <TaskItem key="action">
            <span className="inline-flex items-center gap-1">
              Warning issued to
              <TaskItemFile>
                <AlertTriangle className="size-3" />
                <span>player2</span>
              </TaskItemFile>
            </span>
          </TaskItem>
        );
        details.push(
          <TaskItem key="reason">Reason: Unsportsmanlike conduct</TaskItem>
        );
      }

      details.push(
        <TaskItem key="timestamp">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </TaskItem>
      );

      return details;
    };

    return (
      <div className="my-2 w-full">
        <Task className="w-full" defaultOpen={false}>
          <TaskTrigger title={getToolTitle()}>
            <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
              {getToolIcon()}
              <p className="text-sm">{getToolTitle()}</p>
              <div className="ml-auto flex items-center gap-1">
                <TaskItemFile>
                  <span className="text-xs">Admin</span>
                </TaskItemFile>
              </div>
            </div>
          </TaskTrigger>
          <TaskContent>{getToolDetails()}</TaskContent>
        </Task>
      </div>
    );
  };

  const groupedMessages = messages.reduce(
    (acc, message, index) => {
      if (message.type === "tool") {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.type === "toolGroup") {
          lastGroup.messages.push(message);
        } else {
          acc.push({
            type: "toolGroup" as const,
            id: `group-${message.id}`,
            messages: [message],
            timestamp: message.timestamp,
          });
        }
      } else {
        acc.push(message);
      }
      return acc;
    },
    [] as (
      | ChatMessage
      | {
          type: "toolGroup";
          id: string;
          messages: ChatMessage[];
          timestamp: Date;
        }
    )[]
  );

  const renderToolGroup = (toolMessages: ChatMessage[]) => {
    const toolDetails = toolMessages
      .map((message, index) => {
        if (message.toolType === "mapban") {
          return (
            <TaskItem key={`${index}-mapban`}>
              <span className="flex items-center gap-2 text-sm">
                <Ban className="h-3 w-3 text-muted-foreground" />
                Team 1 banned Clubhouse
              </span>
            </TaskItem>
          );
        }
        if (message.toolType === "timeout") {
          return (
            <TaskItem key={`${index}-timeout`}>
              <span className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Player timeout applied to player1 (30s)
              </span>
            </TaskItem>
          );
        }
        if (message.toolType === "warning") {
          return (
            <TaskItem key={`${index}-warning`}>
              <span className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                Warning issued to player2 - Unsportsmanlike conduct
              </span>
            </TaskItem>
          );
        }
        return (
          <TaskItem key={`${index}-other`}>
            <span className="flex items-center gap-2 text-sm">
              <Shield className="h-3 w-3 text-muted-foreground" />
              {message.content}
            </span>
          </TaskItem>
        );
      })
      .filter(Boolean);

    return (
      <div className="my-2 w-full">
        <Task className="w-full" defaultOpen={false}>
          <TaskTrigger title={`${toolMessages.length} Actions performed`}>
            <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="size-4 text-muted-foreground group-data-[state=open]:hidden" />
              <ChevronDown className="hidden size-4 text-muted-foreground group-data-[state=open]:block" />
              <p className="text-sm">{toolMessages.length} Actions performed</p>
            </div>
          </TaskTrigger>
          <TaskContent>{toolDetails}</TaskContent>
        </Task>
      </div>
    );
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const detectLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const cleanUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);

      // Remove common tracking parameters
      const paramsToRemove = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "msclkid",
        "mc_cid",
        "mc_eid",
        "_ga",
        "_gl",
        "ref_src",
        "ref_url",
      ];

      paramsToRemove.forEach((param) => {
        urlObj.searchParams.delete(param);
      });

      // Add Strave.gg reference
      urlObj.searchParams.set("ref", "Strave.gg");

      return urlObj.toString();
    } catch {
      return url;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          className={cn(
            "relative h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95"
          )}
          onClick={handleOpen}
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full p-0 font-medium text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <img
              alt="Full size"
              className="max-h-full max-w-full rounded object-contain"
              onClick={(e) => e.stopPropagation()}
              src={selectedImage || "/placeholder.svg"}
            />
            <Button
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Card
        className={cn(
          "flex h-[500px] w-80 origin-bottom-right flex-col shadow-xl",
          "slide-in-from-bottom-2 fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=closed]:fade-out-0 animate-in duration-150 data-[state=closed]:animate-out data-[state=closed]:duration-100"
        )}
      >
        <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b bg-muted/30 p-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Match Chat</span>
          </div>
          <Button
            className={cn(
              "h-6 w-6 p-0 transition-all duration-150 hover:scale-110 hover:bg-destructive/10 hover:text-destructive"
            )}
            onClick={handleClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-3 w-3" />
          </Button>
        </CardHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {groupedMessages.map((item) => {
            if (item.type === "toolGroup") {
              return <div key={item.id}>{renderToolGroup(item.messages)}</div>;
            }

            const message = item as ChatMessage;
            const isCurrentUser = message.userId === currentUserId;
            const userTag = getUserTag(message.userId);
            const userName = getUserName(message.userId);

            return (
              <div
                className={cn(
                  "flex flex-col",
                  isCurrentUser ? "items-end" : "items-start"
                )}
                key={message.id}
              >
                <div
                  className={cn(
                    "max-w-[85%] break-words rounded-lg p-2 text-sm",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {!isCurrentUser && (
                    <div className="mb-1 flex items-center gap-1">
                      <Badge className="px-1 py-0 text-xs" variant="secondary">
                        {userTag}
                      </Badge>
                      <span className="font-medium text-xs">{userName}</span>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none [&>*]:my-0">
                    {renderMessageContent(message)}
                  </div>
                </div>

                <span className="mt-1 text-muted-foreground text-xs">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && filteredUsers.length > 0 && (
          <div className="shrink-0 border-t bg-background p-2">
            <div className="max-h-20 space-y-1 overflow-y-auto">
              {filteredUsers.map((user, index) => (
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-muted",
                    index === 0 && "bg-muted"
                  )}
                  key={user.id}
                  onClick={() => handleMentionSelect(user)}
                >
                  <Badge className="px-1 py-0 text-xs" variant="secondary">
                    {user.isTeamMember
                      ? "[Team]"
                      : user.isAdmin
                        ? "[Admin]"
                        : "[Strave]"}
                  </Badge>
                  {user.username}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="shrink-0 border-t bg-background p-2">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {attachments.map((file, index) => (
                <div
                  className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                  key={index}
                >
                  {getFileIcon(file.type)}
                  <span className="max-w-12 truncate">
                    {truncateFilename(file.name, 8)}
                  </span>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Button
              className="absolute top-1/2 left-1 z-10 h-7 w-7 -translate-y-1/2 rounded-full p-0 hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>

            <Input
              className="h-9 rounded-full pr-12 pl-10 text-sm"
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              ref={inputRef}
              value={inputValue}
            />

            <Button
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full p-0"
              disabled={!inputValue.trim() && attachments.length === 0}
              onClick={handleSendMessage}
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          <input
            accept=".png,.jpg,.jpeg,.svg,.pdf,.txt"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </Card>
    </div>
  );
}
