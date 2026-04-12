export interface Stock {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  amount: number
  isUp: boolean
  ask1: number
  ask1Vol: number
  ask2: number
  ask2Vol: number
  ask3: number
  ask3Vol: number
  ask4: number
  ask4Vol: number
  ask5: number
  ask5Vol: number
  bid1: number
  bid1Vol: number
  bid2: number
  bid2Vol: number
  bid3: number
  bid3Vol: number
  bid4: number
  bid4Vol: number
  bid5: number
  bid5Vol: number
  priceHistory: number[]
}

export interface PositionLot {
  id: string
  quantity: number
  price: number
  date: number
  available: boolean
}

export interface Position {
  code: string
  name: string
  totalQuantity: number
  availableQuantity: number
  frozenQuantity: number
  costAmount: number
  currentPrice: number
  lots: PositionLot[]
}

export interface Order {
  id: string
  code: string
  name: string
  type: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  price: number
  quantity: number
  filledQuantity: number
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected'
  time: number
  message?: string
  fee?: FeeDetail
}

export interface FeeDetail {
  stampDuty: number
  commission: number
  transferFee: number
  total: number
}

export interface Trade {
  id: string
  orderId: string
  code: string
  name: string
  type: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  fee: FeeDetail
  time: number
  settled: boolean
}

export interface Account {
  initialBalance: number
  totalAssets: number
  marketValue: number
  availableBalance: number
  withdrawableBalance: number
  frozenBalance: number
  totalProfitLoss: number
  todayProfitLoss: number
  profitLossPercent: number
}

export interface FundRecord {
  id: string
  type: 'in' | 'out' | 'trade' | 'fee' | 'settlement'
  amount: number
  balance: number
  time: number
  remark: string
}
