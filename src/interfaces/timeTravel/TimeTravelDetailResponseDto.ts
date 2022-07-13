import { MessageInfo } from '../message/MessageInfo';

export interface TimeTravelDetailResponseDto {
  title: string;
  year: number;
  month: number;
  day: number;
  writtenDate: string;
  image: string;
  messages: MessageInfo[];
}
