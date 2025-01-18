import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

const options = {
  plugins: {
    legend: {
      display: false,
    },
  },
};

const PortfolioChart = ({ data }) => {
  console.log("PortfolioChart data:", data);

  const setGraphColor = () => {
    if (data?.change < 0) {
      return "#ef4b09";
    } else {
      return "#00ff1a";
    }
  };

  // Limit to the last 6 months
  const processLastSixMonths = (data) => {
    if (!data?.data || data.data.length < 6) return data?.data || [];
    // Get the last 6 months' data
    const lastSixMonthsData = data.data.slice(-6);
    return lastSixMonthsData;
  };

  const processedData = processLastSixMonths(data);

  // Generate dynamic month labels for the last 6 months
  const generateMonthLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    let labels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[date.getMonth()]);
    }
    return labels;
  };

  const labels = generateMonthLabels();

  const lineGraph = {
    labels, // Dynamic labels for the last 6 months
    datasets: [
      {
        fill: false,
        lineTension: 0.01,
        backgroundColor: setGraphColor(),
        borderColor: setGraphColor(),
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: setGraphColor(),
        pointBackgroundColor: setGraphColor(),
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: setGraphColor(),
        pointHoverBorderColor: setGraphColor(),
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: processedData, // Use filtered data for the last 6 months
      },
    ],
  };

  if (!data) {
    return <div>Loading chart...</div>;
  }

  return <Line data={lineGraph} options={options} width={400} height={150} />;
};

export default PortfolioChart;