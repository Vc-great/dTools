export enum RefType {
	Branch = "branch",
	Tag = "tag",
}
export const RefTypeOptions = [
	{ label: "Branch", value: RefType.Branch },
	{ label: "Tag", value: RefType.Tag },
];

export const refTypeLabel = {
	[RefType.Branch]: "Branch",
	[RefType.Tag]: "Tag",
};
