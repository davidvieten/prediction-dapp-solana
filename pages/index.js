// Components
import Header from "../components/Header";
import PortfolioChart from "../components/PortfolioChart";

// Icons
import { IoMdArrowDropdown } from "react-icons/io";

// Dependencies
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import DropDown from "../components/DropDown";
import AvailableBets from "../components/AvailableBets";
import CustomModal from "../components/CustomModal";

// API Imports
import { fetchCryptoData, fetchStockData } from "../data/api";

// SOLANA IMPORTS
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { useGlobalState } from "../hooks";

// Styles
const styles = {
  wrapper: "w-screen h-screen flex flex-col",
  mainContainer: "w-2/3 h-full m-auto flex mt-16",
  leftMain: "flex flex-col w-3/4 h-full  p-6 overflow-y-scroll",
  portfolioAmountContainer: "flex flex-col ",
  portfolioAmount: "text-white text-4xl",
  portfolioPercent: "text-white font-bold text-sm",
  pastHour: "text-gray-400",
  chartContainer:
    "text-5xl flex justify-center w-full h-1/3 text-white mt-11 mb-11",
  buyingPowerContainer:
    "w-full border-t   h-16 border-[#30363b] flex justify-between items-center p-4",
  buyingPowerTitle: "text-white font-bolder text-xl",
  buyingPowerAmount:
    "text-white font-bolder text-xl flex flex-row items-center relative ",
  notice: "flex border border-[#30363b] mx-11 my-4 p-5 flex-col flex-1",
  noticeContainer: "flex-1",
  noticeTitle: "text-gray-500",
  noticeMessage: "text-white font-bold",
  noticeCTA: "font-bold text-green-500 cursor-pointer mt-5",
  rightMain:
    "flex flex-col flex-1 h-4/5 bg-[#1E2123] mt-6 rounded-lg overflow-y-scroll noScroll",
  dropDownBets:
    "absolute bg-[#1E2123] border-[#30363b] px-2 py-2 border rounded-xl top-7",
  formButtons: " w-full flex flex-row justify-center p-2 text-2xl",
  button:
    "rounded-lg py-2 px-16 text-[#ffffff] text-xs border-[#30363b] bg-[#1E2123] border ",
  inputForm: "flex flex-row mt-4",
  input:
    "rounded-lg px-5 border-[#30363b] bg-[#1E2123] border mx-2 w-3/4 p-1 text-[#ffffff] focus:outline-none",
  availableBetsContainer: "flex flex-col mt-4 border-t border-[#30363b] pt-2",
  availableBetsTitle: "text-[#ffffff] font-bolder text-lg ",
  availableBetsItem:
    "flex flex-row justify-between items-center border-b border-[#30363b] pb-2",
  currentStockPrice: "flex flex-col justify-center items-center",
  currentStockPriceTitle: "text-[8px] text-[#ffffff] mt-4",
  currentStockPriceAmount: "text-lg text-[#ffffff]",
};

const timeTypes = ["seconds", "days", "months"];

const Home = () => {
  const [showStockDropDown, setShowStockDropDown] = useState(false);
  const [showAssetDropDown, setShowAssetDropDown] = useState(true);
  const [showBetDropdown, setShowBetDropdown] = useState(false);

  // Initialize state with empty arrays
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);

  const [data, setData] = useState(null);
  const [guess, setGuess] = useState("");
  const [sol, setSol] = useState("");
  const [time, setTime] = useState("");
  const [timeType, setTimeType] = useState(timeTypes[0]);
  const [timeDropDown, setTimeTypeDropDown] = useState(false);
  const [selectedBet, setSelectedBet] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [stockName, setStockName] = useState("");
  const [stockPrice, setStockPrice] = useState(0);
  const [priceKey, setPriceKey] = useState("");
  const [availableStock, setAvailableStock] = useState([]);

  const { allBets, createBet } = useGlobalState();

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      const crypto = await fetchCryptoData();
      const stocks = await fetchStockData();

      setCryptoData(crypto);
      setStockData(stocks);

      // Set default data (first stock)
      if (stocks.length > 0) {
        setData(stocks[0]);
        setStockName(stocks[0].name);
        setStockPrice(stocks[0].price);
        setPriceKey(stocks[0].priceKey || "4Nd1mFq5Y1i44VWdGbJb7F5yA8abJeEtXGyD6cso5poU"); // Default valid key
      }
    };

    fetchData();
  }, []);

  if (!cryptoData.length || !stockData.length) {
    return <div>Loading data...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <Header />
      <Toaster position="top-center" reverseOrder={false} />
      <div className={styles.mainContainer}>
        <div className={styles.leftMain}>
          <div className={styles.portfolioAmountContainer}>
            <div className={styles.portfolioAmount}>{data?.name}</div>
            <div className={styles.portfolioPercent}>
              {data?.change}% <span className={styles.pastHour}>Past Hour</span>
            </div>
          </div>
          <div>
            <div className={styles.chartContainer}>
              <PortfolioChart data={data} />
            </div>
          </div>
          <div className={styles.buyingPowerContainer}>
            <div
              className={styles.buyingPowerAmount}
              onClick={() => setShowBetDropdown(!showBetDropdown)}
            >
              {stockName} <IoMdArrowDropdown />
              {showBetDropdown && (
                <div className={styles.dropDownBets}>
                  {stockData.map((stock) => (
                    <p
                      key={stock.name}
                      onClick={() => {
                        setStockName(stock.name);
                        setStockPrice(stock.price);
                        setPriceKey(stock.priceKey || "4Nd1mFq5Y1i44VWdGbJb7F5yA8abJeEtXGyD6cso5poU");
                        setData(stock);
                      }}
                    >
                      {stock.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.buyingPowerTitle}>Bet On Stocks</div>
          </div>
          <form className="flex flex-col">
            <div className={styles.inputForm}>
              <input
                className={styles.input}
                placeholder={"PREDICTION"}
                type="number"
                required
                onChange={(e) => setGuess(e.target.value)}
                value={guess}
              />
              <input
                className={styles.input}
                placeholder={"SOL"}
                type="number"
                required
                onChange={(e) => setSol(e.target.value)}
                value={sol}
              />
              <input
                className={styles.input}
                placeholder={timeType}
                type="number"
                required
                onChange={(e) => setTime(e.target.value)}
                value={time}
              />
              <div
                className={styles.buyingPowerAmount}
                onClick={() => setTimeTypeDropDown(!timeDropDown)}
              >
                {timeType} <IoMdArrowDropdown />
                {timeDropDown && (
                  <div className={styles.dropDownBets}>
                    {timeTypes.map((type) => (
                      <p key={type} onClick={() => setTimeType(type)}>
                        {type}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <input
              type="submit"
              disabled={!priceKey || availableStock.length === stockData.length}
              value="Submit"
              className={`${styles.button} bg-[#ef4b09] w-1/4 text-center mt-8 self-center`}
              onClick={(e) => {
                e.preventDefault();
                try {
                  createBet(
                    new BN(Number(sol) * LAMPORTS_PER_SOL),
                    Number(guess),
                    Number(time),
                    new PublicKey(priceKey)
                  );
                } catch (error) {
                  console.error("Error creating bet:", error);
                }
              }}
            />
          </form>
          <AvailableBets
            availableStock={availableStock}
            setSelectedBet={setSelectedBet}
            setShowModal={setShowModal}
            data={data}
          />
        </div>
        <div className={styles.rightMain}>
          <DropDown
            data={stockData}
            setData={setData}
            showDropDown={showAssetDropDown}
            setShowDropDown={setShowAssetDropDown}
            title={"Stocks/Assets"}
          />
          <DropDown
            data={cryptoData}
            setData={setData}
            showDropDown={showStockDropDown}
            setShowDropDown={setShowStockDropDown}
            title={"Crypto Currencies"}
          />
        </div>
      </div>
      <CustomModal
        isOpen={showModal}
        selectedBet={selectedBet}
        setAvailableStock={setAvailableStock}
        setShowModal={setShowModal}
      />
    </div>
  );
};

export default Home;