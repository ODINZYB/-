export const translations = {
  en: {
    // Header & Layout
    connectWallet: "CONNECT WALLET",
    connecting: "CONNECTING...",
    subtitle: "Decentralized Universal Income",
    referredBy: "Referred by: ",
    footer: "MARS-X ECOSYSTEM © 2026",
    
    // Status & Dashboard
    systemOnline: "SYSTEM ONLINE",
    totalAssets: "Total Assets",
    referralLink: "Referral Link",
    copy: "COPY",
    copied: "COPIED",
    
    // Quota Dashboard
    deviceQuota: "Device Quota",
    active: "ACTIVE",
    fingerprint: "FINGERPRINT",
    valid: "VALID",
    encrypted: "ENCRYPTED",
    
    // Leaderboard
    communityTreasury: "COMMUNITY TREASURY",
    milestoneRewards: "Global Milestone Rewards",
    level: "LEVEL",
    minted: "MINTED",
    claimed: "CLAIMED",
    claimReward: "Claim Reward",
    alreadyClaimed: "Already Claimed",
    
    // Sync Button
    syncing: "SYNCING...",
    recharging: "Recharging",
    initiate: "INITIATE",
    exploration: "EXPLORATION",
    
    // Notifications & Errors
    awaitingConfirmation: "Awaiting Confirmation...",
    fetchingFee: "Fetching fee...",
    sendingTx: "Sending Transaction...",
    waitingBlock: "Waiting for block confirmation...",
    syncSuccess: "Sync Successful!",
    txRejected: "Transaction Rejected by User",
    cooldownActive: "Cooldown active. Please wait.",
    syncFailed: "Sync Failed. See console.",
    pleaseConnect: "Please connect your wallet first!",
    noWeb3: "Web3 provider not found",
    installWallet: "Please install MetaMask or another Web3 wallet!",
    claiming: "Claiming",
    claimedSuccess: "Claimed Successfully!"
  },
  zh: {
    // Header & Layout
    connectWallet: "连接钱包",
    connecting: "连接中...",
    subtitle: "去中心化全民基本收入",
    referredBy: "推荐人: ",
    footer: "MARS-X 生态系统 © 2026",
    
    // Status & Dashboard
    systemOnline: "系统在线",
    totalAssets: "总资产",
    referralLink: "推荐链接",
    copy: "复制",
    copied: "已复制",
    
    // Quota Dashboard
    deviceQuota: "设备配额",
    active: "活跃",
    fingerprint: "设备指纹",
    valid: "有效",
    encrypted: "已加密",
    
    // Leaderboard
    communityTreasury: "社区金库",
    milestoneRewards: "全球里程碑奖励",
    level: "等级",
    minted: "次交互",
    claimed: "已领取",
    claimReward: "领取奖励",
    alreadyClaimed: "已领取",
    
    // Sync Button
    syncing: "同步中...",
    recharging: "充能中",
    initiate: "启动",
    exploration: "探索",
    
    // Notifications & Errors
    awaitingConfirmation: "等待确认...",
    fetchingFee: "获取手续费信息...",
    sendingTx: "发送交易...",
    waitingBlock: "等待区块确认...",
    syncSuccess: "同步成功！",
    txRejected: "用户拒绝了交易",
    cooldownActive: "冷却中，请稍后再试。",
    syncFailed: "同步失败，请查看控制台。",
    pleaseConnect: "请先连接您的钱包！",
    noWeb3: "未找到 Web3 提供程序",
    installWallet: "请安装 MetaMask 或其他 Web3 钱包！",
    claiming: "正在领取",
    claimedSuccess: "领取成功！"
  }
};

export type Language = 'en' | 'zh';