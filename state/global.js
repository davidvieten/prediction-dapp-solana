import { createContext, use, useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { getProgram, getBetAccountPk, getMasterAccountPk } from "../utils/program";
import toast from "react-hot-toast";

export const GlobalContext = createContext({
    isConnected: null, // Boolean to check if the wallet is connected
    wallet: null, // The current wallet object
    hadUserAccount: null, // (Not used in this example, could track if a user account exists)
    allBets: null, // List of all bets fetched from the blockchain
    fetchBets: null, // Function to fetch all bets
});

export const GlobalState = ({ children }) => {
    // State variables
    const [program, setProgram] = useState(); // Program instance for interacting with Solana
    const [isConnected, setIsConnected] = useState(); // Whether a wallet is connected
    const [masterAccount, setMasterAccount] = useState(); // Master account holding global bet info
    const [allBets, setAllBets] = useState(); // List of all bets
    const [userBets, setUserBets] = useState(); // (Optional) Bets specific to the user

    const { connection } = useConnection(); // Solana connection object
    const wallet = useAnchorWallet(); // Wallet object from Solana wallet adapter

    console.log("Connected to:", connection.rpcEndpoint); // Debugging: log the RPC endpoint

    // Initialize the program instance whenever the connection or wallet changes
    useEffect(() => {
        if (connection) {
            // Initialize the program with the connection and wallet
            setProgram(getProgram(connection, wallet ?? {}));
        } else {
            setProgram(null); // Clear the program if no connection
        }
    }, [connection, wallet]);

    // Track the wallet's connection status
    useEffect(() => {
        setIsConnected(!!wallet?.publicKey);
    }, [wallet]);

    // Fetch the master account data from the blockchain
    const fetchMasterAccount = useCallback(async () => {
        if (!program) return; // Return early if the program is not initialized

        try {
            console.log("Fetching master account...");
            const masterAccountPk = await getMasterAccountPk(); // Get the master account's public key
            const masterAccount = await program.account.master.fetch(masterAccountPk); // Fetch the account data
            setMasterAccount(masterAccount); // Store the fetched data in state
        } catch (e) {
            console.error("Error fetching master account:", e.message);
            setMasterAccount(null); // Reset master account on error
        }
    }, [program]);

    // Automatically fetch the master account when needed
    useEffect(() => {
        if (!masterAccount && program) {
            fetchMasterAccount();
        }
    }, [fetchMasterAccount, masterAccount, program]);

    // Fetch all bets from the blockchain
    const fetchBets = useCallback(async () => {
        if (!program) return; // Return early if the program is not initialized

        try {
            const allBetsResult = await program.account.bet.all(); // Fetch all bet accounts
            const allBets = allBetsResult.map((bet) => bet.account); // Extract the account data
            setAllBets(allBets); // Store the fetched bets in state
        } catch (e) {
            console.error("Error fetching bets:", e.message);
        }
    }, [program]);

    // Automatically fetch bets when needed
    useEffect(() => {
        if (!allBets) {
            fetchBets();
        }
    }, [allBets, fetchBets]);

    // Function to create a new bet
    const createBet = useCallback(
        async (amount, price, duration, pythPriceKey) => {
            if (!masterAccount || !wallet) return; // Ensure prerequisites are met

            try {
                console.log("Creating bet...");
                const betId = masterAccount.lastBetId.addn(1); // Generate the next bet ID

                const txHash = await program.methods
                    .createBet(amount, price, duration, pythPriceKey)
                    .accounts({
                        bet: await getBetAccountPk(betId), // Bet account
                        master: await getMasterAccountPk(), // Master account
                        player: wallet.publicKey, // Player's wallet address
                    })
                    .rpc();

                console.log("Bet created with transaction hash:", txHash);
                toast.success("Bet created");

                // Refresh data after creating the bet
                fetchBets();
                fetchMasterAccount();
            } catch (e) {
                toast.error("Error creating bet");
                console.error("Error creating bet:", e.message);
            }
        },
        [masterAccount, program, wallet, fetchBets, fetchMasterAccount]
    );

    // Function to allow a player to enter a bet
    const enterBet = useCallback(
        async (price, bet) => {
            if (!masterAccount || !wallet) return;

            try {
                const txHash = await program.methods
                    .enterBet(price)
                    .accounts({
                        bet: await getBetAccountPk(bet.id), // Bet account
                        player: wallet.publicKey, // Player's wallet address
                    })
                    .rpc();

                console.log("Bet entered with transaction hash:", txHash);
                toast.success("Bet entered successfully");
            } catch (e) {
                toast.error("Error entering bet");
                console.error("Error entering bet:", e.message);
            }
        },
        [masterAccount, program, wallet]
    );

    // Function to close a bet
    const closeBet = useCallback(
        async (bet) => {
            if (!masterAccount || !wallet) return;

            try {
                console.log("Closing bet...");
                const txHash = await program.methods
                    .closeBet()
                    .accounts({
                        bet: await getBetAccountPk(bet.id), // Bet account
                        player: wallet.publicKey, // Player's wallet address
                    })
                    .rpc();

                console.log("Bet closed with transaction hash:", txHash);
                toast.success("Bet closed");

                // Refresh bets after closing
                fetchBets();
            } catch (e) {
                toast.error("Error closing bet");
                console.error("Error closing bet:", e.message);
            }
        },
        [masterAccount, program, wallet, fetchBets]
    );

    // Function to claim the outcome of a bet
    const claimBet = useCallback(
        async (bet) => {
            if (!masterAccount || !wallet) return;

            try {
                const txHash = await program.methods
                    .claimBet()
                    .accounts({
                        bet: await getBetAccountPk(bet.id), // Bet account
                        pyth: bet.pythPriceKey, // Pyth oracle price key
                        playerA: bet.predictionA.player, // Player A's address
                        playerB: bet.predictionB.player, // Player B's address
                        signer: wallet.publicKey, // The wallet signing the transaction
                    })
                    .rpc();

                console.log("Bet claimed with transaction hash:", txHash);
                toast.success("Bet claimed");
            } catch (e) {
                toast.error("Error claiming bet");
                console.error("Error claiming bet:", e.message);
            }
        },
        [masterAccount, program, wallet]
    );

    // Provide global state and functions to children components
    return (
        <GlobalContext.Provider
            value={{
                masterAccount,
                allBets,
                createBet,
                closeBet,
                enterBet,
                claimBet,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};