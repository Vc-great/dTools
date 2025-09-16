import type React from "react";

type IconProps = {
	name: string; // iconfont 图标名，例如 'icon-home'
	size?: number; // 尺寸
	color?: string; // 颜色
	className?: string;
};

const Icon: React.FC<IconProps> = ({
	name,
	size = 16,
	color = "currentColor",
	className,
}) => {
	return (
		<svg
			className={className}
			aria-hidden="true"
			style={{
				width: size,
				height: size,
				fill: color,
				verticalAlign: "middle",
			}}
		>
			<use xlinkHref={`#${name}`} />
		</svg>
	);
};

export default Icon;
