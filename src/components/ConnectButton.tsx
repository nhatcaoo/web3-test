import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";
import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Link,
  Td,
} from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { injected } from "../config/wallets";
import abi from "./abi.json";
import { AbiItem } from "web3-utils";
declare global {
  interface Window {
    ethereum: any;
  }
}
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

export default function ConnectButton() {
  const { account, active, activate, library, deactivate } = useWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useLocalStorage<boolean>(
    "connected",
    false
  );
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [gasFee, setGasFee] = useState<string>("");
  const [gasLimit, setGasLimit] = useState<number>(0);
  const toast = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const apiHost = "http://localhost:4000/api/v1";
  const fetchTransactions = useCallback(async () => {
    try {
      // Fetch the transactions data from the server
      const response = await fetch(`${apiHost}/transactions`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      // Sort the transactions in descending order based on the createdAt field
      const sortedTransactions = data.transactions.sort((a: any, b: any) => {
        const timestampA = Date.parse(a.createdAt);
        const timestampB = Date.parse(b.createdAt);
        return timestampB - timestampA;
      });
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);
  // Function to update the account value in local storage
  // const updateLocalStorageAccount = (accountValue: string | null) => {
  //   setAccount(accountValue);
  // };
  function handleConnectWallet() {
    connected ? deactivate() : activate(injected);
    console.log(
      "🚀 ~ file: ConnectButton.tsx:97 ~ handleConnectWallet ~ connected:",
      connected
    );
    setConnected(!connected);
  }

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }

  function handleChangeAddress(event: any) {
    setRecieverAdd(event.target.value);
  }

  function handleChangeAmount(event: any) {
    setSendAmount(event.target.value);
  }

  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === 0) {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }

    const web3 = new Web3(library.provider);
    var block = await web3.eth.getBlock("latest");
    setGasLimit(block.gasLimit);

    const gasPrice = await web3.eth.getGasPrice();
    setGasFee(toGWei(web3, gasPrice.toString()));

    onOpen();
  }

  const sendAction = useCallback(async () => {
    setLoading(true); // Start loading
    let scaledAmount;
    const web3 = new Web3(library.provider);
    let txHash = "";

    try {
      if (mode === "BabyDoge") {
        // If the modal is open, send BabyDoge
        const ctx = new web3.eth.Contract(
          abi as AbiItem[],
          "0x28017936e4e95ccafe2d3d89c222bf470e58965e"
        );

        scaledAmount = Web3.utils.toWei(sendAmount.toString(), "gwei");
        const transferTx = await ctx.methods
          .transfer(recieverAdd, scaledAmount)
          .send({ from: account });
        txHash = transferTx.transactionHash;
      } else {
        scaledAmount = Web3.utils.toWei(sendAmount.toString(), "ether");
        // If the modal is closed, send Ether
        const txParams: any = {
          from: account,
          to: recieverAdd,
          value: scaledAmount,
        };

        const sendTx = await web3.eth.sendTransaction(txParams);
        txHash = sendTx.transactionHash;
      }

      onClose();

      const formData = {
        sender: account ?? "",
        receiver: recieverAdd,
        token: mode,
        transactionHash: txHash,
        amount: scaledAmount,
      };

      // Send the transaction data to the server
      const response = await fetch(`${apiHost}/transaction/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Response from server:", data);

      valueload();
      fetchTransactions();
    } catch (error) {
      console.error("Error:", error);
      // Handle any errors that occurred during the transaction or API call
    } finally {
      setLoading(false); // Stop loading
    }
  }, [account, library, isOpen, recieverAdd, sendAmount]);

  function fromWei(
    web3: { utils: { fromWei: (arg0: any) => any } },
    val: { toString: () => any }
  ) {
    if (val) {
      val = val.toString();
      return web3.utils.fromWei(val);
    } else {
      return "0";
    }
  }

  function toGWei(web3: any, val: string) {
    if (val) {
      return web3.utils.fromWei(val, "gwei");
    } else {
      return "0";
    }
  }

  const valueload = useCallback(async () => {
    const web3 = new Web3(library.provider);
    const ctx = new web3.eth.Contract(
      abi as AbiItem[],
      "0x28017936e4e95ccafe2d3d89c222bf470e58965e"
    );
    if (account) {
      const value = await web3.eth.getBalance(account);
      setBalance(Number(fromWei(web3, value)).toFixed(5));

      const gasPrice = await web3.eth.getGasPrice();
      setGasFee(gasPrice);

      const value1 = await ctx.methods
        .balanceOf(account)
        .call({ gasPrice: Number(gasPrice) * 100 });
      console.log("[baby amount]", value1);
      setBabyBalance(value1);
    }
  }, [account, library]);
  function formatDate(createdAt: string) {
    try {
      const date = new Date(createdAt);
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "short", // This will show the timezone abbreviation (e.g., EDT, PDT)
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error("Error parsing date:", error);
      return "Invalid date";
    }
  }
  function shortenAddress(address: string, digits = 4) {
    return `${address.substring(0, digits + 2)}...${address.substring(
      address.length - digits
    )}`;
  }

  function shortenHash(hash: string, digits = 6) {
    return `${hash.substring(0, digits + 2)}...${hash.substring(
      hash.length - digits
    )}`;
  }
  function convertAmount(amount: number, token: string): string {
    const web3 = new Web3();

    // Convert amount to a valid number
    const parsedAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(parsedAmount)) {
      // Return a default value if the amount is not a valid number
      return "NaN";
    }
    if (token === "BNB") {
      return web3.utils.fromWei(parsedAmount.toString(), "ether");
    } else if (token === "BabyDoge") {
      return web3.utils.fromWei(parsedAmount.toString(), "gwei");
    } else {
      return amount.toString();
    }
  }
  useEffect(() => {
    if (!active && connected) {
      activate(injected);
    } else {
      valueload();
      fetchTransactions();
    }
  }, [account, active, valueload, fetchTransactions, connected]);

  return (
    <>
      <h1 className="title">Metamask login demo from Enva Division</h1>
      {account ? (
        <Box
          display="block"
          alignItems="center"
          background="white"
          borderRadius="xl"
          p="4"
          width="300px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              Account:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {`${account.slice(0, 6)}...${account.slice(
                account.length - 4,
                account.length
              )}`}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BabyDoge Balance :
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {babyBalance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB Balance:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {balance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB / BabyDoge
            </Text>
            <Switch
              size="md"
              value={mode}
              isChecked={mode === "BabyDoge"}
              onChange={handleMode}
            />
          </Box>
          <Box
            display="block"
            justifyContent="space-between"
            alignItems="center"
            mb="4"
          >
            <Text color="#158DE8" fontWeight="medium">
              Send {mode}:
            </Text>
            <Input
              bg="#EBEBEB"
              size="lg"
              value={recieverAdd}
              onChange={handleChangeAddress}
            />
          </Box>
          <Box display="flex" alignItems="center" mb="4">
            <Input
              bg="#EBEBEB"
              size="lg"
              value={sendAmount}
              onChange={handleChangeAmount}
            />
            <Button
              onClick={handleOpenModal}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              ml="2"
              border="1px solid transparent"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Send
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Button
              onClick={handleConnectWallet}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              border="1px solid transparent"
              width="300px"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Disconnect Wallet
            </Button>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Are you Sure?</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div>
                  Are you sure {sendAmount} {mode} to {recieverAdd} user?
                </div>
                <div>Gas Limit: {gasLimit}</div>
                <div>Gas Price: {gasFee}</div>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="ghost"
                  isLoading={loading}
                  onClick={sendAction}
                >
                  Send
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      ) : (
        <Box bg="white" p="4" borderRadius="xl">
          <Button
            onClick={handleConnectWallet}
            bg="#158DE8"
            color="white"
            fontWeight="medium"
            borderRadius="xl"
            border="1px solid transparent"
            width="300px"
            _hover={{
              borderColor: "blue.700",
              color: "gray.800",
            }}
            _active={{
              backgroundColor: "blue.800",
              borderColor: "blue.700",
            }}
          >
            Connect Wallet
          </Button>
        </Box>
      )}
      <Box
        bg="white"
        p="4"
        borderRadius="xl"
        mt="4"
        overflowY="auto"
        maxHeight="400px"
      >
        <Text fontWeight="medium" fontSize="xl" mb="4">
          Transactions:
        </Text>
        {account ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Token</Th>
                <Th>Sender</Th>
                <Th>Receiver</Th>
                <Th>Amount</Th>
                <Th>Transaction Hash</Th>
                <Th>Created At</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((tx) => (
                <Tr key={tx.transactionHash}>
                  <Td>{tx.token}</Td>
                  <Td>
                    <Link
                      href={`https://testnet.bscscan.com/address/${tx.sender}`}
                      isExternal
                      color="blue.500"
                    >
                      {shortenAddress(tx.sender)}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`https://testnet.bscscan.com/address/${tx.receiver}`}
                      isExternal
                      color="blue.500"
                    >
                      {shortenAddress(tx.receiver)}
                    </Link>
                  </Td>
                  <Td>{convertAmount(tx.amount, tx.token)}</Td>
                  <Td>
                    <Link
                      href={`https://testnet.bscscan.com/tx/${tx.transactionHash}`}
                      isExternal
                      color="blue.500"
                    >
                      {shortenHash(tx.transactionHash)}
                    </Link>
                  </Td>
                  <Td>{formatDate(tx.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : null}
      </Box>
      ;
    </>
  );
}
