import type { FindProjectResponseDto, ProjectResponseDto } from "@shared/types";
import dayjs from "dayjs";

type Node = ProjectResponseDto & { label: string; children?: Node[] };

export function buildTree(nodes: FindProjectResponseDto): Node[] {
	const nodeMap = new Map<string, Node>();

	nodes.forEach((node) => {
		nodeMap.set(node.id, { ...node, label: node.name, children: [] });
	});

	const tree: Node[] = [];

	nodes
		.sort((a, b) => {
			return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
		})
		.forEach((node) => {
			if (node.parentId) {
				const parent = nodeMap.get(node.parentId);
				if (parent) {
					parent.children?.push(nodeMap.get(node.id)!);
				}
			} else {
				tree.push(nodeMap.get(node.id)!);
			}
		});

	return tree;
}
