import type {
	DeployConfigEntityDto,
	GitAccountEntityDto,
	VirtualMachineEntityDto,
} from "@shared/types";

export interface GetDeployConfigResponseVo extends DeployConfigEntityDto {
	gitAccount?: GitAccountEntityDto;
	vmAccount?: VirtualMachineEntityDto;
}
