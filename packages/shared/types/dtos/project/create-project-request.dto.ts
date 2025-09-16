import type {ProjectType} from "@shared/types";

export type CreateProjectRequestDto = {
  name:string
  type:ProjectType
  parentId?:string
}
