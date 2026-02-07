// Icon.tsx - Legacy wrapper, use @strave/icons directly instead
import { DynamicIcon } from "@strave/icons";

const typeMap: { [key: string]: string } = {
  solid: "fa-solid",
  regular: "fa-regular",
  light: "fa-light",
  brands: "fa-brands",
};

type IconProps = {
  iconName: string;
  iconType?: "solid" | "regular" | "light" | "brands";
  className?: string;
  size?: number;
};

/**
 * @deprecated Use icons from @strave/icons directly instead
 * @example import { CheckIcon } from "@strave/icons"
 */
function Icon({ iconName, iconType = "solid", className, size }: IconProps) {
  const faType = typeMap[iconType] || "fa-solid";
  const iconClass = `${faType} fa-${iconName}`;

  return (
    <DynamicIcon className={className} iconClass={iconClass} size={size} />
  );
}

export default Icon;
