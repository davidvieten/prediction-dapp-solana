import axios from "axios";

// Fetch Crypto Data from API
export const fetchCryptoData = async () => {
    const coins = ["bitcoin", "ethereum", "solana", "cardano"]; // Cryptocurrencies to fetch
    const vsCurrency = "usd";
    const historicalDays = 180; // Historical data range for charts

    try {
        // Fetch data for all coins in a single batch request
        const allCoinResponses = await Promise.all(
            coins.map((coin) =>
                axios.get(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart`, {
                    params: {
                        vs_currency: vsCurrency,
                        days: historicalDays, // Fetch data for the last 180 days
                    },
                })
            )
        );

        const cryptoData = allCoinResponses.map((response, index) => {
            const historicalData = response.data.prices.map(([_, price]) => price); // Extract prices

            // Calculate hourly change (using last two data points from the API)
            const mostRecentPrice = historicalData[historicalData.length - 1];
            const priceOneHourAgo = historicalData[historicalData.length - 2];
            const hourlyChange = (
                ((mostRecentPrice - priceOneHourAgo) / priceOneHourAgo) *
                100
            ).toFixed(2);

            return {
                name: coins[index].charAt(0).toUpperCase() + coins[index].slice(1), // Capitalize coin name
                price: mostRecentPrice, // Most recent price
                change: hourlyChange, // Last hour change percentage
                data: historicalData, // Historical data for charts
            };
        });

        return cryptoData;
    } catch (error) {
        console.error("Error fetching crypto data:", error);
        return [];
    }
};
// Fetch Stock Data
export const fetchStockData = async () => {
    return [
        {
            name: "AAPL",
            price: 150,
            change: "1.24",
            data: [140, 145, 150, 155, 150], // Mock historical data
        }, 
        {
            name: "GOOGL",
            price: 2800,
            change: "-0.67",
            data: [2750, 2780, 2800, 2820, 2800], // Mock historical data
        }, 
        {
            name: "AMZN",
            price: 3400,
            change: "0.98",
            data: [3300, 3350, 3400, 3450, 3400], // Mock historical data
        }, 
        {
            name: "MSFT",
            price: 299,
            change: "0.45",
            data: [290, 295, 299, 303, 299], // Mock historical data
        },
    ];
};