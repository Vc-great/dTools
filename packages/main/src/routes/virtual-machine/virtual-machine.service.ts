import { virtualMachineStore } from "@main/store/virtual-machine-store.ts";
import type {
	CreateVirtualMachineRequestDto,
	DeleteVirtualMachineResponseVo,
	FindAllVirtualMachinesResponseDto,
	TestVmConnectionRequestDto,
	TestVmConnectionResponseVo,
	UpdateVirtualMachineRequestDto,
	VirtualMachineEntityDto,
} from "@shared/types";
import dayjs from "dayjs";
import { v4 as uuidV4 } from "uuid";
import { decrypt, encrypt } from "../git/utils/crypto.ts";
import { testSSHConnection } from "./utils/test-ssh-connection";

export class VirtualMachineService {
	/**
	 * 获取所有虚拟机列表
	 */
	async findAllVirtualMachines(): Promise<FindAllVirtualMachinesResponseDto> {
		// 解密密码后返回
		return virtualMachineStore.store.virtualMachines
			.map((vm) => ({
				...vm,
				password: "",
			}))
			.reverse();
	}

	/**
	 * 创建虚拟机
	 */
	async createVirtualMachine(
		data: CreateVirtualMachineRequestDto,
	): Promise<VirtualMachineEntityDto> {
		const newVirtualMachines: VirtualMachineEntityDto = {
			id: uuidV4(),
			...data,
			password: encrypt(data.password),
			createdAt: dayjs().utc().toISOString(),
			updatedAt: dayjs().utc().toISOString(),
		};

		virtualMachineStore.appendToArray("virtualMachines", newVirtualMachines);

		// 返回解密后的数据
		return {
			...newVirtualMachines,
			password: data.password,
		};
	}

	async updateVirtualMachine(
		data: UpdateVirtualMachineRequestDto,
	): Promise<VirtualMachineEntityDto> {
		const existingProject = virtualMachineStore.store.virtualMachines.find(
			(virtualMachine) => virtualMachine.id === data.id,
		);
		if (!existingProject) {
			throw new Error(`VirtualMachine with id ${data.id} not found`);
		}

		const updatedProject: VirtualMachineEntityDto = {
			...data,
			password: encrypt(data.password),
			createdAt: existingProject.createdAt, // 保持原始创建时间
			updatedAt: dayjs().utc().toISOString(),
		};

		virtualMachineStore.set(
			"virtualMachines",
			virtualMachineStore.store.virtualMachines.map((virtualMachine) =>
				virtualMachine.id === data.id ? updatedProject : virtualMachine,
			),
		);

		// 返回解密后的数据
		return {
			...updatedProject,
			password: "",
		};
	}

	async deleteVirtualMachine({
		id,
	}: {
		id: string;
	}): Promise<DeleteVirtualMachineResponseVo> {
		const existingProject = virtualMachineStore.store.virtualMachines.find(
			(virtualMachine) => virtualMachine.id === id,
		);
		if (!existingProject) {
			throw new Error(`VirtualMachine with id ${id} not found`);
		}

		virtualMachineStore.set(
			"virtualMachines",
			virtualMachineStore.store.virtualMachines.filter(
				(virtualMachine) => virtualMachine.id !== id,
			),
		);

		return {
			message: "Project deleted successfully",
		};
	}

	async testVmConnection(
		data: TestVmConnectionRequestDto,
	): Promise<TestVmConnectionResponseVo> {
		// 测试连接时使用原始密码（已经是解密状态）
		return testSSHConnection(data);
	}
}

// 导出单例实例
export const virtualMachineService = new VirtualMachineService();
