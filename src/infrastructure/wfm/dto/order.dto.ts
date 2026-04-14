import { UserShortDTO } from "./user.dto";
interface OrderDTO {
  id: string;
  type: string;
  platinum: number;
  quantity: number;
  perTrade: number;
  rank: number;
  charges: number;
  subtype: string;
  amberStars: number;
  cyanStars: number;
  vosfor: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  itemId: string;
}

export interface OrderWithUserDTO extends OrderDTO {
  user: UserShortDTO;
}
