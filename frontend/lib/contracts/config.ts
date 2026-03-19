export const PEACE_PROTOCOL_ADDRESS = "0xAf66240F72f2b2078e525a8F60E8CF52FeD45f89"; // TODO: Replace with actual deployed address

export const PEACE_PROTOCOL_ABI = [
  // read
  "function COOLDOWN_PERIOD() view returns (uint256)",
  "function REWARD_AMOUNT() view returns (uint256)",
  "function interactionFee() view returns (uint256)",
  // write
  "function interact(address referrer) external payable"
];

// If you need to read balance directly from the token contract
export const PEACE_TOKEN_ADDRESS = "0xaC2560aDb5026203C26Eb95ff9f8178846fd8FB6"; // TODO: Replace
export const PEACE_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)"
];
