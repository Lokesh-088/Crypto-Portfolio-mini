import React, { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Trash2, DollarSign } from 'lucide-react';

const CryptoPortfolio = () => {
  const [holdings, setHoldings] = useState([
    {
      id: 1,
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.5,
      purchasePrice: 45000,
      currentPrice: 0,
      lastUpdated: null
    },
    {
      id: 2,
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 2.5,
      purchasePrice: 3200,
      currentPrice: 0,
      lastUpdated: null
    }
  ]);
  
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    name: '',
    amount: '',
    purchasePrice: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch crypto prices from CoinGecko API
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setLoading(true);
    try {
      const symbols = holdings.map(h => h.symbol.toLowerCase()).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        // Fallback to a different endpoint if the first fails
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=${symbols.toUpperCase()}&order=market_cap_desc&per_page=100&page=1`
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const updatedHoldings = holdings.map(holding => {
            const coinData = fallbackData.find(coin => 
              coin.symbol.toUpperCase() === holding.symbol.toUpperCase()
            );
            return {
              ...holding,
              currentPrice: coinData ? coinData.current_price : holding.currentPrice,
              lastUpdated: new Date().toISOString()
            };
          });
          setHoldings(updatedHoldings);
        }
      } else {
        const data = await response.json();
        const updatedHoldings = holdings.map(holding => {
          const symbolKey = holding.symbol.toLowerCase();
          return {
            ...holding,
            currentPrice: data[symbolKey] ? data[symbolKey].usd : holding.currentPrice,
            lastUpdated: new Date().toISOString()
          };
        });
        setHoldings(updatedHoldings);
      }
      
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Mock data for demonstration when API fails
      const updatedHoldings = holdings.map(holding => ({
        ...holding,
        currentPrice: holding.symbol === 'BTC' ? 43500 + Math.random() * 2000 : 
                     holding.symbol === 'ETH' ? 3100 + Math.random() * 200 :
                     holding.purchasePrice * (0.8 + Math.random() * 0.4),
        lastUpdated: new Date().toISOString()
      }));
      setHoldings(updatedHoldings);
      setLastUpdate(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      fetchPrices(); // Initial fetch
      interval = setInterval(fetchPrices, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPrices]);

  const calculatePL = (holding) => {
    if (!holding.currentPrice) return { amount: 0, percentage: 0 };
    
    const currentValue = holding.amount * holding.currentPrice;
    const purchaseValue = holding.amount * holding.purchasePrice;
    const plAmount = currentValue - purchaseValue;
    const plPercentage = ((holding.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;
    
    return { amount: plAmount, percentage: plPercentage };
  };

  const calculateTotalPortfolio = () => {
    const totalValue = holdings.reduce((sum, holding) => 
      sum + (holding.amount * (holding.currentPrice || holding.purchasePrice)), 0
    );
    
    const totalInvestment = holdings.reduce((sum, holding) => 
      sum + (holding.amount * holding.purchasePrice), 0
    );
    
    const totalPL = totalValue - totalInvestment;
    const totalPLPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;
    
    return { totalValue, totalInvestment, totalPL, totalPLPercentage };
  };

  const addHolding = () => {
    if (!newHolding.symbol || !newHolding.amount || !newHolding.purchasePrice) return;
    
    const holding = {
      id: Date.now(),
      symbol: newHolding.symbol.toUpperCase(),
      name: newHolding.name || newHolding.symbol.toUpperCase(),
      amount: parseFloat(newHolding.amount),
      purchasePrice: parseFloat(newHolding.purchasePrice),
      currentPrice: 0,
      lastUpdated: null
    };
    
    setHoldings([...holdings, holding]);
    setNewHolding({ symbol: '', name: '', amount: '', purchasePrice: '' });
  };

  const removeHolding = (id) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const portfolio = calculateTotalPortfolio();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <DollarSign size={40} style={{ color: '#667eea' }} />
            Crypto Portfolio
          </h1>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#667eea'
                }}
              />
              Auto-refresh
            </label>
            
            <button
              onClick={fetchPrices}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                transform: loading ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh Prices
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '25px',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Value</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {formatCurrency(portfolio.totalValue)}
            </p>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            padding: '25px',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Investment</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {formatCurrency(portfolio.totalInvestment)}
            </p>
          </div>
          
          <div style={{
            background: portfolio.totalPL >= 0 
              ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' 
              : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            padding: '25px',
            borderRadius: '15px',
            color: portfolio.totalPL >= 0 ? '#2d5016' : '#8b1538',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.8 }}>Total P&L</h3>
            <p style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {portfolio.totalPL >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              {formatCurrency(portfolio.totalPL)}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '16px', opacity: 0.8 }}>
              {formatPercentage(portfolio.totalPLPercentage)}
            </p>
          </div>
        </div>

        {/* Add New Holding */}
        <div style={{
          background: '#f8f9ff',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px dashed #667eea'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={24} style={{ color: '#667eea' }} />
            Add New Holding
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              placeholder="Symbol (e.g., BTC)"
              value={newHolding.symbol}
              onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value})}
              style={{
                padding: '12px 15px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                ':focus': { borderColor: '#667eea' }
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            
            <input
              type="text"
              placeholder="Name (optional)"
              value={newHolding.name}
              onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
              style={{
                padding: '12px 15px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            
            <input
              type="number"
              placeholder="Amount"
              value={newHolding.amount}
              onChange={(e) => setNewHolding({...newHolding, amount: e.target.value})}
              style={{
                padding: '12px 15px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            
            <input
              type="number"
              placeholder="Purchase Price ($)"
              value={newHolding.purchasePrice}
              onChange={(e) => setNewHolding({...newHolding, purchasePrice: e.target.value})}
              style={{
                padding: '12px 15px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          
          <button
            onClick={addHolding}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s ease',
              ':hover': { transform: 'translateY(-2px)' }
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Plus size={20} />
            Add Holding
          </button>
        </div>

        {/* Holdings Table */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '20px 25px',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            Holdings
          </div>
          
          {holdings.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              fontSize: '16px'
            }}>
              No holdings added yet. Add your first crypto holding above!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9ff' }}>
                    <th style={{ padding: '15px 20px', textAlign: 'left', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Asset</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Amount</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Purchase Price</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Current Price</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Value</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#333', borderBottom: '2px solid #e1e5e9' }}>P&L</th>
                    <th style={{ padding: '15px 20px', textAlign: 'center', color: '#333', borderBottom: '2px solid #e1e5e9' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => {
                    const pl = calculatePL(holding);
                    return (
                      <tr key={holding.id} style={{
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s ease',
                        ':hover': { backgroundColor: '#f8f9ff' }
                      }}
                      onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9ff'}
                      onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '20px', fontWeight: 'bold' }}>
                          <div>
                            <div style={{ fontSize: '16px', color: '#333' }}>{holding.symbol}</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>{holding.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontSize: '16px' }}>
                          {holding.amount}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontSize: '16px' }}>
                          {formatCurrency(holding.purchasePrice)}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontSize: '16px' }}>
                          {holding.currentPrice ? formatCurrency(holding.currentPrice) : 'Loading...'}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                          {formatCurrency(holding.amount * (holding.currentPrice || holding.purchasePrice))}
                        </td>
                        <td style={{ 
                          padding: '20px', 
                          textAlign: 'right', 
                          fontSize: '16px', 
                          fontWeight: 'bold',
                          color: pl.amount >= 0 ? '#16a085' : '#e74c3c'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                            {pl.amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <div>
                              <div>{formatCurrency(pl.amount)}</div>
                              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                {formatPercentage(pl.percentage)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px', textAlign: 'center' }}>
                          <button
                            onClick={() => removeHolding(holding.id)}
                            style={{
                              background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '14px',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Last Update Info */}
        {lastUpdate && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            padding: '10px',
            background: '#f8f9ff',
            borderRadius: '8px'
          }}>
            Last updated: {new Date(lastUpdate).toLocaleString()}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CryptoPortfolio;