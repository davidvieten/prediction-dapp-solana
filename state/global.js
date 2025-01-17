import { createContext, use, useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { getProgram, getBetAccountPk, getMasterAccountPk } from "../utils/program";
import toast from "react-hot-toast";
import { set } from "@project-serum/anchor/dist/cjs/utils/features";

export const GlobalContext = createContext({
    isConnected: null,
    wallet: null,
    hadUserAccount: null,
    allBets: null,
    fetchBets: null,
});

export const GlobalState = ({ children }) => {
    const [program, setProgram] = useState();
    const [isConnected, setIsConnected] = useState();
    const [masterAccount, setMasterAccount] = useState();
    const [allBets, setAllBets] = useState();
    const [userBets, setUserBets] = useState();

    const {connection} = useConnection();
    const wallet = useAnchorWallet();

    let connect = true;
    console.log("Connected to:", connection.rpcEndpoint);

    //Set Program
    useEffect( () => {
        if(connection) {
            // If no wallet, use empty object
            setProgram(getProgram(connection, wallet ?? {}));
        } else {
            setProgram(null);
        }
        //Set program when connection or wallet changes
    }, [connection, wallet])

    //Check wallet connection
    useEffect(() => {
        setIsConnected(!!wallet?.publicKey);
    }, [wallet])

    const fetchMasterAccount = useCallback(async () => {
        if(!program) return;

        try {
            console.log("Is this running?");
            const masterAcccountPk = await getMasterAccountPk();
            const masterAccount = await program.account.master.fetch(masterAcccountPk);
            setMasterAccount(masterAccount);
        } catch (e) {
            console.log("Error fetching master account", e.message);
            setMasterAccount(null);
        }
    }, [])

    //Check for master account 
    useEffect(() => {
        if(!masterAccount && program) {
        fetchMasterAccount()
        } 
    }, [fetchMasterAccount, masterAccount, program])

    //Fetch all bets
    const fetchBets = useCallback(async () => {
        if(!program) return;
        const allBetsResult = await program.account.bet.all();
        const allBets = allBetsResult.map((bet) => bet.account);
        setAllBets(allBets);

        //If we want just users bets, we can use .filter
         
    }, [program]);

    useEffect(() => {
        //Fetch all bets if allbets does not exist
        if(!allBets) {
            fetchBets();
        }
    }, [allBets, fetchBets])

    const createBet = useCallback (
        async (amount, price, duration, pythPriceKey) => {
            if (!masterAccount) return;
            try {
                console.log("Running");
                const betId = masterAccount.lastBetId .addn(1);
                const res = await getBetAccountPk(betId);
                console.log("Bet account pk", res);
                let bet = await getBetAccountPk(betId);
                let master = await getMasterAccountPk();
                let player = await wallet.publicKey;

                console.log("Bet", bet.toString(), "Master", master.toString(), "Player", player.toString());
                //Broken here
                const txHash = await program.methods
                    .createBet(amount, price, duration, pythPriceKey)
                    .accounts({
                        bet: await getBetAccountPk(betId),
                        master: await getMasterAccountPk(),
                        player: wallet.publicKey,
                    })
                    .rpc()
                console.log("Transaction hash", txHash);
                await connection.confirmTransaction(txHash);
                console.log("Bet created", txHash);
                toast.success("Bet created");
            } catch (e) {
                toast.error("Error creating bet");
                console.log("Error creating bet", e.message);
            }
        },
        [masterAccount]
    )

    return (
        <GlobalContext.Provider
            value={{
                masterAccount,
                allBets,
                createBet,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}