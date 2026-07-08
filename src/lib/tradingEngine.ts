/**
 * NEXUS TRADING CORE ENGINE (MICROSERVICES DESIGN PATTERN)
 * Implements: Market Data Simulation, Order Matching Engine, Portfolio Valuations,
 * and the Nexus Credits (CR) Ledger audit system keeping data secure and high-availability.
 */

// Types & Interfaces
export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  prevClose: number;
  history1D: { time: string; price: number }[]; // Simulated minute ticks (Recharts)
  priceChange: number;
  priceChangePercent: number;
}

export interface UserCreditsProfile {
  username: string;
  email: string;
  creditsBalance: number; // In Nexus Credits (CR)
  vcoinBalance: number; // External network currency
  exchangeRateCR: number; // Current conversion (CR per 1 V-COIN)
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  averagePrice: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderClass: 'MARKET' | 'LIMIT';
  shares: number;
  limitPrice?: number;
  executedPrice?: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalCredits: number;
  timestamp: string;
}

export interface LedgerEntry {
  id: string;
  txType: 'BUY_STOCK' | 'SELL_STOCK' | 'DEPOSIT_CONVERSION' | 'ADMIN_ADJUST';
  amountCR: number; // positive = added, negative = deducted
  exchangeRate: number;
  description: string;
  timestamp: string;
}

// -------------------------------------------------------------
// 1. DATA STORE (In-Memory Highly Persistent State Container)
// -------------------------------------------------------------
class CentralDataStore {
  public stocks: Record<string, Stock> = {};
  public userProfile: UserCreditsProfile = {
    username: "NexusOperator",
    email: "anshsureshsingh07@gmail.com",
    creditsBalance: 125000.00, // Starting CR balance
    vcoinBalance: 84250.00,     // Stored V-Net token balance
    exchangeRateCR: 1.25,       // 1 V-COIN = 1.25 CR
  };
  public portfolio: Record<string, PortfolioHolding> = {};
  public orders: Order[] = [];
  public ledger: LedgerEntry[] = [];

  constructor() {
    this.initializeStocks();
    this.initializePortfolio();
    this.initializeLedger();
  }

  private initializeStocks() {
    const defaultSecurities = [
      { symbol: 'VNG', name: 'Vanguard CyberTech Corp', sector: 'Defense Technology', basePrice: 340.50 },
      { symbol: 'SHND', name: 'Shindo Robotics Allied', sector: 'Cybernetics & Mechatronics', basePrice: 185.25 },
      { symbol: 'KRP', name: 'Capsule Synergy Holdings', sector: 'Quantum Propulsion', basePrice: 612.40 },
      { symbol: 'SND', name: 'Shinra Mako Utilities', sector: 'Mako Grid Infrastructure', basePrice: 84.75 },
      { symbol: 'NEX', name: 'Nexus Quantum Elements', sector: 'High-Density Crystals', basePrice: 1210.00 },
      { symbol: 'ANM', name: 'AnimeInt Global Media Network', sector: 'Neural Reality & Media', basePrice: 45.10 }
    ];

    defaultSecurities.forEach(sec => {
      // Create starting history logs
      const history: { time: string; price: number }[] = [];
      const baseTime = Date.now() - 3600000; // 1 hr ago
      for (let i = 0; i <= 30; i++) {
        const timeStr = new Date(baseTime + i * 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const drift = (Math.random() - 0.49) * (sec.basePrice * 0.015);
        history.push({ time: timeStr, price: Math.max(1, Number((sec.basePrice + drift).toFixed(2))) });
      }

      this.stocks[sec.symbol] = {
        symbol: sec.symbol,
        name: sec.name,
        sector: sec.sector,
        currentPrice: sec.basePrice,
        prevClose: Number((sec.basePrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
        history1D: history,
        priceChange: 0,
        priceChangePercent: 0
      };
      this.recalculateChange(sec.symbol);
    });
  }

  private initializePortfolio() {
    // Starting portfolio holdings for demo experience
    this.portfolio['VNG'] = { symbol: 'VNG', shares: 50, averagePrice: 325.20 };
    this.portfolio['ANM'] = { symbol: 'ANM', shares: 250, averagePrice: 42.50 };
  }

  private initializeLedger() {
    this.ledger = [
      {
        id: "ledg_001",
        txType: "DEPOSIT_CONVERSION",
        amountCR: 50000.00,
        exchangeRate: 1.25,
        description: "Initial conversion of 40000 V-COIN to Nexus Credits (CR)",
        timestamp: "08:15:32"
      },
      {
        id: "ledg_002",
        txType: "BUY_STOCK",
        amountCR: -16260.00,
        exchangeRate: 1.0,
        description: "Bought 50 shares of VNG at 325.20 CR per share",
        timestamp: "09:30:15"
      },
      {
        id: "ledg_003",
        txType: "BUY_STOCK",
        amountCR: -10625.00,
        exchangeRate: 1.0,
        description: "Bought 250 shares of ANM at 42.50 CR per share",
        timestamp: "10:14:48"
      }
    ];

    // Seed dummy completed orders corresponding to starting portfolio
    this.orders = [
      {
        id: "ord_vng_start",
        symbol: "VNG",
        type: "BUY",
        orderClass: "MARKET",
        shares: 50,
        executedPrice: 325.20,
        status: "COMPLETED",
        totalCredits: 16260.00,
        timestamp: "09:30:15"
      },
      {
        id: "ord_anm_start",
        symbol: "ANM",
        type: "BUY",
        orderClass: "MARKET",
        shares: 250,
        executedPrice: 42.50,
        status: "COMPLETED",
        totalCredits: 10625.00,
        timestamp: "10:14:48"
      }
    ];
  }

  public recalculateChange(symbol: string) {
    const s = this.stocks[symbol];
    if (!s) return;
    s.priceChange = Number((s.currentPrice - s.prevClose).toFixed(2));
    s.priceChangePercent = Number(((s.priceChange / s.prevClose) * 100).toFixed(2));
  }
}

export const dbSource = new CentralDataStore();

// -------------------------------------------------------------
// 2. MICROSERVICE 1: MARKET DATA SERVICE
// -------------------------------------------------------------
export class MarketDataService {
  /**
   * Fetch all ongoing stock trackers
   */
  public static getSecurities(): Stock[] {
    return Object.values(dbSource.stocks);
  }

  /**
   * Fetch details for a specific asset
   */
  public static getSecurity(symbol: string): Stock | null {
    return dbSource.stocks[symbol.toUpperCase()] || null;
  }

  /**
   * Run real-time random walk price updates (simulates incoming matching feeds)
   */
  public static simulateTick(): void {
    const exchangeFluctuation = (Math.random() - 0.5) * 0.004; // Fluctuation in external exchange rate
    dbSource.userProfile.exchangeRateCR = Number((dbSource.userProfile.exchangeRateCR + exchangeFluctuation).toFixed(4));
    if (dbSource.userProfile.exchangeRateCR < 1.0) dbSource.userProfile.exchangeRateCR = 1.0102;

    const keys = Object.keys(dbSource.stocks);
    keys.forEach(sym => {
      const stock = dbSource.stocks[sym];
      if (!stock) return;

      // Volatility based on stock base size
      const volatility = sym === 'NEX' ? 0.003 : sym === 'ANM' ? 0.006 : 0.004;
      // Introduce an asymmetric drift to represent positive cybernetic market forces
      const drift = 0.0002; 
      const changePercent = (Math.random() - 0.495) * volatility + drift;
      
      const prevPrice = stock.currentPrice;
      const nextPrice = Number((prevPrice * (1 + changePercent)).toFixed(2));
      stock.currentPrice = Math.max(0.5, nextPrice); // Ensure it doesn't drop to 0
      dbSource.recalculateChange(sym);

      // Append price tick history
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      stock.history1D.push({ time: nowStr, price: stock.currentPrice });

      // Cap local chart memory array to last 40 entries to minimize browser/network overhead
      if (stock.history1D.length > 40) {
        stock.history1D.shift();
      }
    });

    // Handle Pending LIMIT orders matching after price update
    OrderMatchingService.matchPendingLimitOrders();
  }
}

// -------------------------------------------------------------
// 3. MICROSERVICE 2: PORTFOLIO AND BALANCE LEDGER SERVICE
// -------------------------------------------------------------
export class PortfolioService {
  /**
   * Calculate exact portfolio valuation
   */
  public static getPortfolioDetails() {
    const holdings = Object.values(dbSource.portfolio).filter(h => h.shares > 0);
    
    let totalInvestedValueCr = 0;
    let totalCurrentValueCr = 0;

    const detailedHoldings = holdings.map(hold => {
      const stock = dbSource.stocks[hold.symbol];
      const currentPrice = stock ? stock.currentPrice : hold.averagePrice;
      const investedValue = hold.shares * hold.averagePrice;
      const currentValue = hold.shares * currentPrice;
      const totalReturn = currentValue - investedValue;
      const totalReturnPercent = investedValue > 0 ? (totalReturn / investedValue) * 100 : 0;

      totalInvestedValueCr += investedValue;
      totalCurrentValueCr += currentValue;

      return {
        ...hold,
        name: stock?.name || hold.symbol,
        currentPrice,
        priceChangePercent: stock?.priceChangePercent || 0,
        investedValue: Number(investedValue.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        totalReturn: Number(totalReturn.toFixed(2)),
        totalReturnPercent: Number(totalReturnPercent.toFixed(2))
      };
    });

    const totalPnL = totalCurrentValueCr - totalInvestedValueCr;
    const totalPnLPercent = totalInvestedValueCr > 0 ? (totalPnL / totalInvestedValueCr) * 100 : 0;

    return {
      holdings: detailedHoldings,
      totalInvested: Number(totalInvestedValueCr.toFixed(2)),
      totalCurrent: Number(totalCurrentValueCr.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
      creditsBalance: dbSource.userProfile.creditsBalance,
      vcoinBalance: dbSource.userProfile.vcoinBalance,
      exchangeRateCR: dbSource.userProfile.exchangeRateCR
    };
  }

  /**
   * Process converting External V-COIN to Internal Nexus Credits (CR)
   */
  public static convertCurrency(vcoinAmount: number): { success: boolean; message: string; balance?: number } {
    if (vcoinAmount <= 0) {
      return { success: false, message: "[LEDGER_ERR] Conversion vector quantity negative." };
    }

    if (dbSource.userProfile.vcoinBalance < vcoinAmount) {
      return { success: false, message: "[LEDGER_ERR] Insufficient V-COIN coordinate ledger balance in outer vault." };
    }

    const currentRate = dbSource.userProfile.exchangeRateCR;
    const creditsProduced = Number((vcoinAmount * currentRate).toFixed(4));

    // Dedcut external, add internal
    dbSource.userProfile.vcoinBalance = Number((dbSource.userProfile.vcoinBalance - vcoinAmount).toFixed(4));
    dbSource.userProfile.creditsBalance = Number((dbSource.userProfile.creditsBalance + creditsProduced).toFixed(4));

    // Append to audit double-entry ledger database
    const newLedgerID = `ledg_${Date.now().toString(36)}`;
    dbSource.ledger.unshift({
      id: newLedgerID,
      txType: 'DEPOSIT_CONVERSION',
      amountCR: creditsProduced,
      exchangeRate: currentRate,
      description: `Converted ${vcoinAmount.toFixed(2)} V-COIN into Nexus Credits at ${currentRate} rate`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    });

    return {
      success: true,
      message: `Successfully synchronized ${creditsProduced.toLocaleString()} CR! Secure conversion ledger locked.`,
      balance: dbSource.userProfile.creditsBalance
    };
  }

  /**
   * Fetch central conversion transactions ledger logs
   */
  public static getLedgerLogs(): LedgerEntry[] {
    return dbSource.ledger;
  }
}

// -------------------------------------------------------------
// 4. MICROSERVICE 3: ORDER MATCHING ENGINE SERVICE
// -------------------------------------------------------------
export class OrderMatchingService {
  /**
   * Fetch all historical and pending orders
   */
  public static getOrders(): Order[] {
    return dbSource.orders;
  }

  /**
   * Submit transaction from UI and immediately dispatch execution matching routines
   */
  public static createOrder(params: {
    symbol: string;
    type: 'BUY' | 'SELL';
    orderClass: 'MARKET' | 'LIMIT';
    shares: number;
    limitPrice?: number;
  }): { success: boolean; message: string; order?: Order } {
    const { symbol, type, orderClass, shares, limitPrice } = params;
    const stock = dbSource.stocks[symbol];

    if (!stock) {
      return { success: false, message: `[MATCHING_ERR] Core security code '${symbol}' was not found in listing.` };
    }

    if (shares <= 0) {
      return { success: false, message: "[MATCHING_ERR] Quantity coordinates must exceed zero shares." };
    }

    const price = orderClass === 'MARKET' ? stock.currentPrice : (limitPrice || stock.currentPrice);
    const totalCreditsNeeded = Number((shares * price).toFixed(2));

    // 1. Core verification gates
    if (type === 'BUY') {
      if (dbSource.userProfile.creditsBalance < totalCreditsNeeded) {
        return { 
          success: false, 
          message: `[MATCHING_ERR] Insufficient Nexus Credits (CR). Required: ${totalCreditsNeeded.toLocaleString()} CR, Vault: ${dbSource.userProfile.creditsBalance.toLocaleString()} CR` 
        };
      }
    } else {
      // Selling: Check actual available holding shares inventory
      const holding = dbSource.portfolio[symbol];
      if (!holding || holding.shares < shares) {
        return { 
          success: false, 
          message: `[MATCHING_ERR] Short sales suspended. Holdings in '${symbol}' lacks required shares inventory.` 
        };
      }
    }

    // 2. Register Order Node
    const orderID = `ord_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: orderID,
      symbol,
      type,
      orderClass,
      shares,
      limitPrice: orderClass === 'LIMIT' ? limitPrice : undefined,
      status: orderClass === 'MARKET' ? 'COMPLETED' : 'PENDING',
      totalCredits: totalCreditsNeeded,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    };

    if (orderClass === 'MARKET') {
      // Execute instantly at current market ticks
      newOrder.executedPrice = stock.currentPrice;
      this.executeFinancialSettle(newOrder);
      dbSource.orders.unshift(newOrder);
      return {
        success: true,
        message: `Market ${type} synchronized successfully at ${stock.currentPrice} CR!`,
        order: newOrder
      };
    } else {
      // LIMIT order pending execution queue
      dbSource.orders.unshift(newOrder);
      return {
        success: true,
        message: `Limit ${type} registered in matched queue. Target index trigger at ${limitPrice} CR nodes.`,
        order: newOrder
      };
    }
  }

  /**
   * Perform direct settlement bookkeeping operations securely settling balances
   */
  private static executeFinancialSettle(order: Order) {
    const execPrice = order.executedPrice || dbSource.stocks[order.symbol]?.currentPrice || 0;
    const finalValuation = Number((order.shares * execPrice).toFixed(2));

    if (order.type === 'BUY') {
      // Dedcut Credits (CR)
      dbSource.userProfile.creditsBalance = Number((dbSource.userProfile.creditsBalance - finalValuation).toFixed(4));
      
      // Credit inventory holding
      if (!dbSource.portfolio[order.symbol]) {
        dbSource.portfolio[order.symbol] = { symbol: order.symbol, shares: 0, averagePrice: 0 };
      }
      
      const holding = dbSource.portfolio[order.symbol];
      const previousTotalCost = holding.shares * holding.averagePrice;
      const additionalCost = finalValuation;
      const newShares = holding.shares + order.shares;
      const newAvg = newShares > 0 ? (previousTotalCost + additionalCost) / newShares : 0;

      holding.shares = newShares;
      holding.averagePrice = Number(newAvg.toFixed(2));

      // Log in central ledger
      dbSource.ledger.unshift({
        id: `ledg_${Date.now().toString(36)}`,
        txType: 'BUY_STOCK',
        amountCR: -finalValuation,
        exchangeRate: 1.0,
        description: `Executed BUY market match: ${order.shares} ${order.symbol} shares at ${execPrice} CR`,
        timestamp: order.timestamp
      });

    } else {
      // SELL trade
      // Add credits CR back to vault
      dbSource.userProfile.creditsBalance = Number((dbSource.userProfile.creditsBalance + finalValuation).toFixed(4));

      // Subtract shares inventory
      const holding = dbSource.portfolio[order.symbol];
      if (holding) {
        holding.shares -= order.shares;
        // If empty inventory, holding keeps averages or clears
        if (holding.shares <= 0) {
          delete dbSource.portfolio[order.symbol];
        }
      }

      // Log sell in audit path
      dbSource.ledger.unshift({
        id: `ledg_${Date.now().toString(36)}`,
        txType: 'SELL_STOCK',
        amountCR: finalValuation,
        exchangeRate: 1.0,
        description: `Executed SELL market match: ${order.shares} ${order.symbol} shares at ${execPrice} CR`,
        timestamp: order.timestamp
      });
    }
  }

  /**
   * Scan limit orders queue to find and match assets based on real-time price changes
   */
  public static matchPendingLimitOrders() {
    dbSource.orders.forEach(order => {
      if (order.status !== 'PENDING') return;

      const stock = dbSource.stocks[order.symbol];
      if (!stock) return;

      const currentTickValue = stock.currentPrice;
      const limitVal = order.limitPrice || 0;

      let isMatchTrig = false;
      if (order.type === 'BUY' && currentTickValue <= limitVal) {
        // Hit buy limit! (Price dropped equal to or below target buy boundary)
        isMatchTrig = true;
      } else if (order.type === 'SELL' && currentTickValue >= limitVal) {
        // Hit sell limit! (Price spiked equal to or above target sell boundary)
        isMatchTrig = true;
      }

      if (isMatchTrig) {
        order.executedPrice = currentTickValue;
        order.status = 'COMPLETED';
        order.timestamp = new Date().toLocaleTimeString([], { hour12: false });
        
        try {
          this.executeFinancialSettle(order);
          console.log(`[Order Matching Engine] LIMIT matched for ${order.shares} shares of ${order.symbol} at ${currentTickValue} CR!`);
        } catch (err: any) {
          order.status = 'CANCELLED';
          console.warn(`[Order Matching Engine] Trade trigger cancel failed matching limit constraints: ${err.message}`);
        }
      }
    });
  }

  /**
   * Cancel pending limit order nodes
   */
  public static cancelOrder(orderID: string): boolean {
    const targetOrder = dbSource.orders.find(o => o.id === orderID);
    if (targetOrder && targetOrder.status === 'PENDING') {
      targetOrder.status = 'CANCELLED';
      targetOrder.timestamp = new Date().toLocaleTimeString([], { hour12: false });
      return true;
    }
    return false;
  }
}
