import { useRef, useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import ErrorMsg from "../components/ErrorMsg";
import { Dollar, Key } from "../components/Icons";
import { Button, ButtonLink } from "../components/Button";
import { toHex, toUSD } from "../utils";
import Stat from "../components/Stat";
import NavBar from "../components/NavBar";

const AVAX_C_ID = 43114;

const DISTRIBUTOR_DATA = {
  address: "0x7ADdC708Fe7a72a58faB8faBD7a86e5999903D42",
  abi: [
    "function claimDividend()",
    "function totalDividends() public view returns (uint256)",
    "function getUnpaidEarnings(address shareholder) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
  ],
};

const ERC20_DATA = {
  address: "0xE1C1a8DCD6aE8b17cC2923A82Ddb9bf8827095B7",
  abi: ["function balanceOf(address owner) view returns (uint balance)"],
};

const Home: NextPage = () => {
  const web3ModalRef = useRef<Web3Modal>();
  const [provider, setProvider] = useState<any>();
  const [ethersProvider, setEthersProvider] = useState<Web3Provider>();
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<string>();
  const [unpaidEarnings, setUnpaidEarnings] = useState("0.0");
  const [balance, setBalance] = useState("0.0");
  const [totalDividends, setTotalDividends] = useState("0.0");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const isAvaxChain = useMemo(() => chainId === toHex(AVAX_C_ID), [chainId]);

  /**
   * @dev connects the users wallet
   */
  const connectWallet = async () => {
    try {
      const provider = await web3ModalRef.current?.connect();
      const _ethersProvider = new ethers.providers.Web3Provider(provider);
      const accounts = await _ethersProvider.listAccounts();
      const network = await _ethersProvider.getNetwork();

      setProvider(provider);
      setEthersProvider(_ethersProvider);
      setChainId(toHex(network.chainId));
      if (accounts) setAccount(accounts[0]);
    } catch (error: any) {
      console.error(error);
    }
  };

  /**
   * @dev switch the network to avax c chain or add it to metamask
   */
  const switchNetwork = async () => {
    if (!ethersProvider?.provider.request) return;

    try {
      await ethersProvider.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(AVAX_C_ID) }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethersProvider.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: toHex(AVAX_C_ID),
                rpcUrls: ["https://api.harmony.one"],
                chainName: "Avalanche Network",
                nativeCurrency: { name: "AVAX", decimals: 18, symbol: "AVAX" },
                blockExplorerUrls: ["https://api.avax.network/ext/bc/C/rpc"],
                iconUrls: ["https://cryptologos.cc/logos/avalanche-avax-logo.png?v=022"],
              },
            ],
          });
        } catch (err: any) {
          console.error(err);
        }
      }
    }
  };

  /**
   * @dev claims the unpaid rewards and refresh page if successfull
   */
  const claimRewards = async () => {
    try {
      const signer = ethersProvider?.getSigner();
      const contract = new ethers.Contract(DISTRIBUTOR_DATA.address, DISTRIBUTOR_DATA.abi, signer);
      setLoading(true);
      const tx = await contract.claimDividend();
      await tx.wait();
      setUnpaidEarnings("0.0");
      setLoading(false);
      alert("Dividends claimed successfully");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  /**
   * @dev fetches core nodes token balance and unpaid earnings
   */
  const fetchContractData = async () => {
    // get token balance
    const erc20 = new ethers.Contract(ERC20_DATA.address, ERC20_DATA.abi, ethersProvider);
    const _balance = await erc20.balanceOf(account);
    setBalance(ethers.utils.formatUnits(_balance.toString(), 6));
    // get unpaid rewards and total dividends
    const distributor = new ethers.Contract(DISTRIBUTOR_DATA.address, DISTRIBUTOR_DATA.abi, ethersProvider);
    const _unpaidEarning = await distributor.getUnpaidEarnings(account);
    const _totalDividends = await distributor.totalDividends();
    setTotalDividends(ethers.utils.formatUnits(_totalDividends.toString(), 6));
    setUnpaidEarnings(ethers.utils.formatUnits(_unpaidEarning.toString(), 6));
  };

  /**
   * @dev init web3modal on first page load and connect if cached connection found
   */
  useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      cacheProvider: true,
      disableInjectedProvider: false,
      network: "avalanche-fuji-mainnet",
      theme: "dark",
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            network: "avalanche-fuji-mainnet",
            // just in case someone connect to a false network
            // prevents runtime error in connectWallet()
            rpc: {
              1: "https://ethereumnodelight.app.runonflux.io",
              56: "https://bsc-dataseed.binance.org/",
              60: "https://rpc.gochain.io",
              88: "https://rpc.tomochain.com",
              128: "https://http-mainnet.hecochain.com/",
              137: "https://polygon-rpc.com/",
              250: "https://rpc.ftm.tools/",
              820: "https://clo-geth.0xinfra.com/",
              [AVAX_C_ID]: "https://api.avax.network/ext/bc/C/rpc",
              42161: "https://arb1.arbitrum.io/rpc",
            },
          },
        },
      },
    });

    if (web3ModalRef.current.cachedProvider) {
      connectWallet();
    }
  }, []);

  /**
   * @dev handle events through tracking the provider state
   */
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = async (accounts: any) => {
        // clear cache on mm disconnect
        if (accounts.length === 0) {
          await web3ModalRef.current?.clearCachedProvider();
        }
        setAccount(accounts[0]);
      };

      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", async () => {
        console.log("disconnect");
        await web3ModalRef.current?.clearCachedProvider();
        setAccount("");
      });

      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [provider]);

  /**
   * @dev fetch and set data on chain and account change
   */
  useEffect(() => {
    if (isAvaxChain && account) {
      fetchContractData();
    } else {
      if (web3ModalRef.current?.cachedProvider === "injected") {
        switchNetwork();
      }
    }
  }, [isAvaxChain, account]);

  /**
   * @dev handle errros
   */
  useEffect(() => {
    if (account && !isAvaxChain) {
      setErrorMsg("Please change the network to AVAX C Chain");
    } else if (!account) {
      setErrorMsg("Please connect your wallet to fetch data and claim rewards");
    } else if (errorMsg) {
      setErrorMsg("");
    }
  }, [chainId, account]);

  return (
    <div className="container px-4 mx-auto mt-16 mb-32">
      <Head>
        <title>Core Nodes - Claim USDC.e rewards</title>
        <meta property="og:title" content="Core Nodes - Claim usdc.e rewards" key="title" />
        <meta
          property="og:description"
          content="Core Nodes - Sustainable Passive Income. Built on the Avalanche Network. Earn Passive Rewards in $USDC and 0.9% Rewards from NAAS"
          key="description"
        />
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>
      <NavBar />
      <div className="mt-24 relative h-12">
        <Image src="/core-logo-final-version.png" layout="fill" objectFit="contain" />
      </div>
      <div className="text-center mt-6">
        <h1 className="font-bold text-4xl uppercase">
          <span className="text-primary">$CORE</span> earned rewards
        </h1>
        <ul className="flex mt-8 mb-10  space-y-8 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row">
          <Stat>
            <p className="text-2xl font-bold">{toUSD(totalDividends)}</p>
            <p>
              Total reflections earned by <span className="text-primary">$CORE</span> holders
            </p>
          </Stat>
          <Stat>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(balance))}
            </p>
            <p>
              Your current <span className="text-primary mt-2">$CORE</span> token balance
            </p>
          </Stat>
          <Stat>
            <p className="text-2xl font-bold text-[#41A345]">{toUSD(unpaidEarnings)}</p>
            <p>
              Your pending <span className="text-primary mt-2">USDC.e</span> rewards
            </p>
          </Stat>
        </ul>
        <div className="flex space-x-6 justify-center">
          {account ? (
            <Button
              primary
              text="Claim rewards"
              onClick={claimRewards}
              loading={loading}
              icon={<Dollar />}
              disabled={!isAvaxChain}
            />
          ) : (
            <Button primary text="Connect Wallet" icon={<Key />} onClick={connectWallet} />
          )}

          <ButtonLink
            href="https://traderjoexyz.com/trade?outputCurrency=0xe1c1a8dcd6ae8b17cc2923a82ddb9bf8827095b7#/"
            text="Buy on Trader Joe"
          />
        </div>
        {errorMsg && <ErrorMsg msg={errorMsg} />}
      </div>
    </div>
  );
};

export default Home;
