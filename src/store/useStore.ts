import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Stock, Position, Order, Trade, Account, FeeDetail } from '../types'
import dayjs from 'dayjs'

const COMMISSION_RATE = 0.00025
const MIN_COMMISSION = 5
const STAMP_DUTY_RATE = 0.001
const TRANSFER_FEE_RATE = 0.00001

const calculateFee = (type: 'buy' | 'sell', amount: number, quantity: number): FeeDetail => {
  const commission = Math.max(amount * COMMISSION_RATE, MIN_COMMISSION)
  const stampDuty = type === 'sell' ? amount * STAMP_DUTY_RATE : 0
  const transferFee = Math.max(quantity * TRANSFER_FEE_RATE, 1)
  return {
    commission,
    stampDuty,
    transferFee,
    total: commission + stampDuty + transferFee
  }
}

const generateOrderBook = (basePrice: number) => {
  const tick = basePrice * 0.001
  return {
    ask1: basePrice + tick,
    ask1Vol: Math.floor(Math.random() * 500 + 10) * 100,
    ask2: basePrice + tick * 2,
    ask2Vol: Math.floor(Math.random() * 800 + 20) * 100,
    ask3: basePrice + tick * 3,
    ask3Vol: Math.floor(Math.random() * 1000 + 50) * 100,
    ask4: basePrice + tick * 4,
    ask4Vol: Math.floor(Math.random() * 1500 + 100) * 100,
    ask5: basePrice + tick * 5,
    ask5Vol: Math.floor(Math.random() * 2000 + 200) * 100,
    bid1: basePrice - tick,
    bid1Vol: Math.floor(Math.random() * 500 + 10) * 100,
    bid2: basePrice - tick * 2,
    bid2Vol: Math.floor(Math.random() * 800 + 20) * 100,
    bid3: basePrice - tick * 3,
    bid3Vol: Math.floor(Math.random() * 1000 + 50) * 100,
    bid4: basePrice - tick * 4,
    bid4Vol: Math.floor(Math.random() * 1500 + 100) * 100,
    bid5: basePrice - tick * 5,
    bid5Vol: Math.floor(Math.random() * 2000 + 200) * 100,
    priceHistory: [],
  }
}

const initialStocks: Stock[] = [
  { code: 'sh600000', name: '浦发银行', price: 12.34, change: 0.25, changePercent: 2.07, open: 12.10, high: 12.45, low: 12.05, volume: 12345678, amount: 152345678, isUp: true, ...generateOrderBook(12.34) },
  { code: 'sh600036', name: '招商银行', price: 38.56, change: -0.85, changePercent: -2.15, open: 39.20, high: 39.50, low: 38.20, volume: 23456789, amount: 912345678, isUp: false, ...generateOrderBook(38.56) },
  { code: 'sh601318', name: '中国平安', price: 52.18, change: 1.28, changePercent: 2.51, open: 51.00, high: 52.80, low: 50.80, volume: 34567890, amount: 1802345678, isUp: true, ...generateOrderBook(52.18) },
  { code: 'sz000001', name: '平安银行', price: 15.67, change: 0.45, changePercent: 2.96, open: 15.20, high: 15.80, low: 15.15, volume: 45678901, amount: 712345678, isUp: true, ...generateOrderBook(15.67) },
  { code: 'sz000858', name: '五粮液', price: 186.50, change: -3.25, changePercent: -1.71, open: 189.00, high: 190.50, low: 185.80, volume: 15678901, amount: 2923456789, isUp: false, ...generateOrderBook(186.50) },
  { code: 'sz300750', name: '宁德时代', price: 215.30, change: 5.80, changePercent: 2.77, open: 210.00, high: 218.50, low: 209.50, volume: 18765432, amount: 4012345678, isUp: true, ...generateOrderBook(215.30) },
  { code: 'sh600519', name: '贵州茅台', price: 1856.00, change: 28.50, changePercent: 1.56, open: 1830.00, high: 1868.00, low: 1825.50, volume: 2345678, amount: 4351234567, isUp: true, ...generateOrderBook(1856.00) },
  { code: 'sz002594', name: '比亚迪', price: 268.90, change: -4.20, changePercent: -1.54, open: 272.50, high: 273.80, low: 267.20, volume: 12876543, amount: 3456789012, isUp: false, ...generateOrderBook(268.90) },
]

const initialAccount: Account = {
  initialBalance: 100000,
  totalAssets: 100000,
  marketValue: 0,
  availableBalance: 100000,
  withdrawableBalance: 100000,
  frozenBalance: 0,
  totalProfitLoss: 0,
  todayProfitLoss: 0,
  profitLossPercent: 0,
}

interface TradingState {
  stocks: Stock[]
  positions: Position[]
  orders: Order[]
  trades: Trade[]
  account: Account
  selectedStock: Stock | null
  lastSettlementDate: string | null

  setSelectedStock: (stock: Stock | null) => void
  updateMarketPrices: () => void
  submitOrder: (code: string, type: 'buy' | 'sell', orderType: 'market' | 'limit', price: number, quantity: number) => { success: boolean; message: string }
  cancelOrder: (orderId: string) => boolean
  processOrders: () => void
  dailySettlement: () => void
  calculateFundamentals: () => void
}

const useStore = create<TradingState>()(
  persist(
    (set, get) => ({
      stocks: initialStocks,
      positions: [],
      orders: [],
      trades: [],
      account: initialAccount,
      selectedStock: null,
      lastSettlementDate: null,

      setSelectedStock: (stock) => set({ selectedStock: stock }),

      updateMarketPrices: () => {
        set(state => ({
          stocks: state.stocks.map(s => {
            const change = (Math.random() - 0.5) * s.price * 0.002
            const newPrice = Math.max(0.01, s.price + change)
            const changeP = newPrice - s.open
            return {
              ...s,
              price: newPrice,
              change: changeP,
              changePercent: (changeP / s.open) * 100,
              isUp: changeP >= 0,
              ...generateOrderBook(newPrice),
            }
          })
        }))
      },

      submitOrder: (code, type, orderType, price, quantity) => {
        const state = get()
        const stock = state.stocks.find(s => s.code === code)
        if (!stock) return { success: false, message: '股票不存在' }

        if (quantity % 100 !== 0) {
          return { success: false, message: '委托数量必须是100的整数倍' }
        }

        const execPrice = orderType === 'market' ? stock.price : price

        if (type === 'buy') {
          const amount = execPrice * quantity
          const fee = calculateFee('buy', amount, quantity)
          const totalNeed = amount + fee.total

          if (state.account.availableBalance < totalNeed) {
            return { success: false, message: '可用资金不足' }
          }

          const order: Order = {
            id: Date.now().toString(),
            code,
            name: stock.name,
            type: 'buy',
            orderType,
            price: execPrice,
            quantity,
            filledQuantity: 0,
            status: 'pending',
            time: dayjs().valueOf(),
          }

          set(state => ({
            orders: [...state.orders, order],
            account: {
              ...state.account,
              availableBalance: state.account.availableBalance - totalNeed,
              frozenBalance: state.account.frozenBalance + totalNeed,
            }
          }))

          setTimeout(() => {
            get().processOrders()
          }, 500 + Math.random() * 1500)

          return { success: true, message: '委托已提交，等待成交' }
        } else {
          const position = state.positions.find(p => p.code === code)
          if (!position || position.availableQuantity < quantity) {
            return { success: false, message: '可卖数量不足（T+1可用）' }
          }

          const order: Order = {
            id: Date.now().toString(),
            code,
            name: stock.name,
            type: 'sell',
            orderType,
            price: execPrice,
            quantity,
            filledQuantity: 0,
            status: 'pending',
            time: dayjs().valueOf(),
          }

          set(state => ({
            orders: [...state.orders, order],
            positions: state.positions.map(p =>
              p.code === code
                ? { ...p, availableQuantity: p.availableQuantity - quantity, frozenQuantity: p.frozenQuantity + quantity }
                : p
            )
          }))

          setTimeout(() => {
            get().processOrders()
          }, 300 + Math.random() * 1000)

          return { success: true, message: '委托已提交，等待成交' }
        }
      },

      processOrders: () => {
        const state = get()
        const pendingOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'partial')

        pendingOrders.forEach(order => {
          const stock = state.stocks.find(s => s.code === order.code)
          if (!stock) return

          const remainingQty = order.quantity - order.filledQuantity
          if (remainingQty <= 0) return

          const fillRatio = order.status === 'pending' ? Math.random() : 1

          if (fillRatio < 0.1) return

          let fillQty: number
          if (fillRatio >= 0.95) {
            fillQty = remainingQty
          } else if (fillRatio >= 0.3) {
            const partialRatio = 0.3 + Math.random() * 0.5
            fillQty = Math.floor(remainingQty * partialRatio / 100) * 100
          } else {
            fillQty = Math.floor(remainingQty * 0.1 / 100) * 100
          }

          if (fillQty === 0) return

          const newFilledQty = order.filledQuantity + fillQty
          const newStatus = newFilledQty >= order.quantity ? 'filled' : 'partial'

          const fee = calculateFee(order.type, order.price * fillQty, fillQty)

          if (order.type === 'buy') {
            const amount = order.price * fillQty
            const totalCost = amount + fee.total

            const positionIndex = state.positions.findIndex(p => p.code === order.code)
            let newPositions = [...state.positions]

            if (positionIndex >= 0) {
              const pos = newPositions[positionIndex]
              newPositions[positionIndex] = {
                ...pos,
                totalQuantity: pos.totalQuantity + fillQty,
                availableQuantity: pos.availableQuantity,
                costAmount: pos.costAmount + amount,
                currentPrice: stock.price,
                lots: [...pos.lots, {
                  id: Date.now().toString(),
                  quantity: fillQty,
                  price: order.price,
                  date: dayjs().valueOf(),
                  available: false,
                }]
              }
            } else {
              newPositions.push({
                code: order.code,
                name: order.name,
                totalQuantity: fillQty,
                availableQuantity: 0,
                frozenQuantity: 0,
                costAmount: amount,
                currentPrice: stock.price,
                lots: [{
                  id: Date.now().toString(),
                  quantity: fillQty,
                  price: order.price,
                  date: dayjs().valueOf(),
                  available: false,
                }]
              })
            }

            const trade: Trade = {
              id: Date.now().toString() + '_t',
              orderId: order.id,
              code: order.code,
              name: order.name,
              type: 'buy',
              price: order.price,
              quantity: fillQty,
              amount,
              fee,
              time: dayjs().valueOf(),
              settled: false,
            }

            const unfilledAmount = order.price * (order.quantity - newFilledQty)
            const unfilledFee = calculateFee('buy', unfilledAmount, order.quantity - newFilledQty)
            const releaseBack = unfilledAmount + unfilledFee.total

            set(state => ({
              orders: state.orders.map(o => o.id === order.id ? { 
                ...o, 
                status: newStatus as any, 
                filledQuantity: newFilledQty,
                fee: {
                  commission: (o.fee?.commission || 0) + fee.commission,
                  stampDuty: (o.fee?.stampDuty || 0) + fee.stampDuty,
                  transferFee: (o.fee?.transferFee || 0) + fee.transferFee,
                  total: (o.fee?.total || 0) + fee.total,
                }
              } : o),
              positions: newPositions,
              trades: [...state.trades, trade],
              account: {
                ...state.account,
                frozenBalance: state.account.frozenBalance - totalCost - (newStatus === 'filled' ? releaseBack : 0),
                availableBalance: state.account.availableBalance + (newStatus === 'filled' ? releaseBack : 0),
              }
            }))
          } else {
            const amount = order.price * fillQty
            const actualReceived = amount - fee.total

            let newPositions = state.positions.map(p => {
              if (p.code === order.code) {
                let remaining = fillQty
                const newLots = [...p.lots].filter(lot => {
                  if (remaining > 0 && lot.available) {
                    if (lot.quantity <= remaining) {
                      remaining -= lot.quantity
                      return false
                    } else {
                      lot.quantity -= remaining
                      remaining = 0
                    }
                  }
                  return true
                })
                const newTotal = newLots.reduce((sum, l) => sum + l.quantity, 0)
                const releasedQty = newStatus === 'filled' ? (order.quantity - newFilledQty) : 0
                return {
                  ...p,
                  totalQuantity: newTotal,
                  frozenQuantity: p.frozenQuantity - fillQty - releasedQty,
                  availableQuantity: p.availableQuantity + releasedQty,
                  lots: newLots,
                }
              }
              return p
            }).filter(p => p.totalQuantity > 0)

            const trade: Trade = {
              id: Date.now().toString() + '_t',
              orderId: order.id,
              code: order.code,
              name: order.name,
              type: 'sell',
              price: order.price,
              quantity: fillQty,
              amount,
              fee,
              time: dayjs().valueOf(),
              settled: false,
            }

            set(state => ({
              orders: state.orders.map(o => o.id === order.id ? { 
                ...o, 
                status: newStatus as any, 
                filledQuantity: newFilledQty,
                fee: {
                  commission: (o.fee?.commission || 0) + fee.commission,
                  stampDuty: (o.fee?.stampDuty || 0) + fee.stampDuty,
                  transferFee: (o.fee?.transferFee || 0) + fee.transferFee,
                  total: (o.fee?.total || 0) + fee.total,
                }
              } : o),
              positions: newPositions,
              trades: [...state.trades, trade],
              account: {
                ...state.account,
                availableBalance: state.account.availableBalance + actualReceived,
              }
            }))
          }
        })

        get().calculateFundamentals()

        setTimeout(() => {
          const s = get()
          if (s.orders.some(o => o.status === 'partial')) {
            s.processOrders()
          }
        }, 1000 + Math.random() * 2000)
      },

      cancelOrder: (orderId) => {
        const state = get()
        const order = state.orders.find(o => o.id === orderId)
        if (!order || order.status !== 'pending') return false

        if (order.type === 'buy') {
          const amount = order.price * order.quantity
          const fee = calculateFee('buy', amount, order.quantity)
          const total = amount + fee.total

          set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o),
            account: {
              ...state.account,
              availableBalance: state.account.availableBalance + total,
              frozenBalance: state.account.frozenBalance - total,
            }
          }))
        } else {
          set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o),
            positions: state.positions.map(p =>
              p.code === order.code
                ? { ...p, availableQuantity: p.availableQuantity + order.quantity, frozenQuantity: p.frozenQuantity - order.quantity }
                : p
            )
          }))
        }

        return true
      },

      dailySettlement: () => {
        const today = dayjs().format('YYYY-MM-DD')
        const state = get()
        
        if (state.lastSettlementDate === today) return

        set(state => ({
          positions: state.positions.map(p => ({
            ...p,
            availableQuantity: p.totalQuantity,
            frozenQuantity: 0,
            lots: p.lots.map(l => ({ ...l, available: true })),
          })),
          trades: state.trades.map(t => ({ ...t, settled: true })),
          account: {
            ...state.account,
            withdrawableBalance: state.account.availableBalance,
          },
          lastSettlementDate: today,
        }))
      },

      calculateFundamentals: () => {
        const state = get()
        const marketValue = state.positions.reduce((sum, p) => {
          const stock = state.stocks.find(s => s.code === p.code)
          return sum + (stock?.price || p.currentPrice) * p.totalQuantity
        }, 0)
        
        const totalAssets = marketValue + state.account.availableBalance + state.account.frozenBalance
        const totalProfitLoss = totalAssets - 100000

        set(state => ({
          account: {
            ...state.account,
            marketValue,
            totalAssets,
            totalProfitLoss,
            profitLossPercent: (totalProfitLoss / 100000) * 100,
          }
        }))
      },
    }),
    {
      name: 'broker-trading-storage',
    }
  )
)

export default useStore
