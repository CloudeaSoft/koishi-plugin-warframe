import { arbitrationScheduleText } from '../../assets/index'

export const arbitrationSchedule: ArbitrationShort[] = arbitrationScheduleText
  .split('\n')
  .map(line => line.split(','))
  .filter(arr => arr.length === 2)
  .map((arr) => {
    return {
      time: parseInt(arr[0]),
      node: arr[1],
    }
  })
