export type Domain = {
  id: number;
  name: string;
  type: string;
  bridge: string;
  handlers: Array<{
    type: string;
    address: string;
  }>;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  nativeTokenFullName: string;
  startBlock: number;
  blockConfirmations: number;
  feeRouter: string;
  feeHandlers: Array<{ address: string; type: "basic" | "oracle" }>;
  resources: Array<{
    resourceId: string;
    type: string;
    address: string;
    symbol: string;
    decimals: number;
  }>;
};