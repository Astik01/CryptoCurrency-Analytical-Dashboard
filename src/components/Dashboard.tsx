import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { fetchTopCryptos, fetchCryptoChartData } from '../services/cryptoService';
import { CryptoData } from '../types/crypto';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import InfoIcon from '@mui/icons-material/Info';

const Dashboard = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('7');
  const [sortBy, setSortBy] = useState('market_cap');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const theme = useTheme();

  // Fetch top cryptocurrencies with better error handling
  const { 
    data: cryptos, 
    isLoading: isLoadingCryptos, 
    refetch: refetchCryptos,
    error: cryptosError 
  } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchTopCryptos,
    refetchInterval: 60000, // Refetch every minute
    retry: 3, // Retry failed requests 3 times
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Fetch chart data with better error handling
  const { 
    data: chartData, 
    isLoading: isLoadingChart,
    error: chartError 
  } = useQuery({
    queryKey: ['chart', selectedCrypto, timeRange],
    queryFn: () => selectedCrypto ? fetchCryptoChartData(selectedCrypto, timeRange) : null,
    enabled: !!selectedCrypto,
    retry: 3,
    staleTime: 30000,
  });

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('cryptoFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return formatPrice(value);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const filteredCryptos = cryptos?.filter(crypto => 
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCryptos = [...(filteredCryptos || [])].sort((a, b) => {
    if (sortBy === 'market_cap') return b.market_cap - a.market_cap;
    if (sortBy === 'price') return b.current_price - a.current_price;
    if (sortBy === 'volume') return b.total_volume - a.total_volume;
    if (sortBy === 'change') return b.price_change_percentage_24h - a.price_change_percentage_24h;
    return 0;
  });

  if (isLoadingCryptos) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div className="loading-spinner" />
      </Box>
    );
  }

  if (cryptosError) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={2}>
        <Typography variant="h6" color="error">
          Error loading cryptocurrencies
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => refetchCryptos()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="card">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" className="text-gradient">
                Crypto Dashboard
              </Typography>
              <IconButton onClick={() => refetchCryptos()} className="btn">
                <RefreshIcon />
              </IconButton>
            </Box>
            <Box className="input-group">
              <TextField
                label="Search Cryptocurrencies"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="market_cap">Market Cap</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="change">24h Change</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper className="card">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedCrypto ? `${cryptos?.find(c => c.id === selectedCrypto)?.name} Price Chart` : 'Select a cryptocurrency'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={chartType === 'area' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setChartType('area')}
                  className="btn"
                >
                  Area
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setChartType('bar')}
                  className="btn"
                >
                  Bar
                </Button>
                {['1', '7', '30', '90'].map((days) => (
                  <Button
                    key={days}
                    variant={timeRange === days ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setTimeRange(days)}
                    className="btn"
                  >
                    {days}d
                  </Button>
                ))}
              </Box>
            </Box>
            {isLoadingChart ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <div className="loading-spinner" />
              </Box>
            ) : chartError ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={300} gap={2}>
                <Typography color="error">
                  Error loading chart data
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => refetchCryptos()}
                >
                  Retry
                </Button>
              </Box>
            ) : selectedCrypto && chartData ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData.prices.map(([timestamp, price]) => ({
                      date: new Date(timestamp).toLocaleDateString(),
                      price,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <RechartsTooltip
                        formatter={(value: number) => formatPrice(value)}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="url(#gradient)"
                        fill="url(#gradient)"
                        fillOpacity={0.3}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4facfe" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData.prices.map(([timestamp, price]) => ({
                      date: new Date(timestamp).toLocaleDateString(),
                      price,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <RechartsTooltip
                        formatter={(value: number) => formatPrice(value)}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="price" fill="url(#gradient)" />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4facfe" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography color="text.secondary">
                  Select a cryptocurrency to view its chart
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="card">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Cryptocurrencies
              </Typography>
              <Tooltip title="Click on a cryptocurrency to view its chart">
                <InfoIcon sx={{ color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">24h Change</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCryptos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">
                          No cryptocurrencies found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCryptos?.map((crypto) => (
                      <TableRow
                        key={crypto.id}
                        onClick={() => setSelectedCrypto(crypto.id)}
                        sx={{ cursor: 'pointer' }}
                        className="table-row-hover"
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img
                              src={crypto.image}
                              alt={crypto.symbol}
                              style={{ width: 24, height: 24 }}
                            />
                            <Box>
                              <Typography variant="body2">{crypto.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {crypto.symbol.toUpperCase()}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatPrice(crypto.current_price)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            icon={crypto.price_change_percentage_24h >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={formatPercentage(crypto.price_change_percentage_24h)}
                            color={crypto.price_change_percentage_24h >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(crypto.id);
                            }}
                          >
                            {favorites.includes(crypto.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 