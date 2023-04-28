import { Setter } from "solid-js";

export const handleConnection = (
  setAccount: Setter<string | null>,
  setChainId: Setter<number | null>
) => async () => {
  if ((window as any).ethereum) {
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log(
        "🚀 ~ file: App.tsx:12 ~ handleConnection ~ accounts:",
        accounts,
      );
      setAccount(accounts[0]);
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
      setChainId(Number(chainId))
    } catch (e) {
      if ((e as any).code === 4001) {
        console.log("Connect to metamask");
      }
    }
  }
};