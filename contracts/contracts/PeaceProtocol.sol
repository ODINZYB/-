// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Mars-X Parallel EVM Optimization Concept - PeaceProtocol
 * @notice 本文件包含 PeaceProtocol 系统的核心组件，专为高并发环境设计。
 * @dev 采用逻辑与数据分离架构，确保合约在并行执行环境下的低冲突率。
 *      系统由三部分组成：
 *      1. PeaceData: 存储用户状态（冷却时间），支持并行读写。
 *      2. PeaceToken: 资产层，负责代币 Mint 和转账。
 *      3. PeaceProtocol: 逻辑层，无状态，协调业务流程。
 */

// ----------------------------------------------------------------------------
// 1. 基础接口定义
// ----------------------------------------------------------------------------

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// ----------------------------------------------------------------------------
// 2. 数据层合约 (Data Layer)
// ----------------------------------------------------------------------------

/**
 * @title PeaceData
 * @dev 专门用于存储用户交互状态的数据合约。
 *      在并行执行环境中，将状态独立存储有助于细粒度的访问控制和冲突隔离。
 */
contract PeaceData {
    // 状态变量：记录每个地址的上次交互时间戳
    // Slot 冲突分析：每个地址占据独立的 Slot，不同用户的交互天然支持并行写入，互不干扰。
    mapping(address => uint256) private _lastInteractions;
    
    // 状态变量：记录每个地址的连续签到次数 (Streak)
    mapping(address => uint256) private _streaks;

    address public protocolAddress;
    address public owner;

    event ProtocolUpdated(address indexed newProtocol);

    modifier onlyProtocol() {
        require(msg.sender == protocolAddress, "Caller is not the protocol");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev 设置允许写入数据的逻辑合约地址
     */
    function setProtocol(address _protocol) external onlyOwner {
        require(_protocol != address(0), "Invalid protocol address");
        protocolAddress = _protocol;
        emit ProtocolUpdated(_protocol);
    }

    /**
     * @dev 读取用户上次交互时间
     */
    function getLastInteraction(address user) external view returns (uint256) {
        return _lastInteractions[user];
    }
    
    /**
     * @dev 读取用户连续签到次数
     */
    function getStreak(address user) external view returns (uint256) {
        return _streaks[user];
    }

    /**
     * @dev 更新用户上次交互时间
     */
    function setLastInteraction(address user, uint256 timestamp) external onlyProtocol {
        _lastInteractions[user] = timestamp;
    }
    
    /**
     * @dev 更新用户连续签到次数
     */
    function setStreak(address user, uint256 streak) external onlyProtocol {
        _streaks[user] = streak;
    }
}

// ----------------------------------------------------------------------------
// 3. 资产层合约 (Asset Layer)
// ----------------------------------------------------------------------------

/**
 * @title PeaceToken
 * @dev 标准 ERC20 实现，带有 Mint 权限控制。
 *      并行优化注记：标准 ERC20 的 totalSupply 是全局热点。
 *      在完全优化的并行链上，建议使用懒更新或分片计数器（Sharded Counter）。
 *      为保持标准兼容性，本实现保留标准逻辑。
 */
contract PeaceToken is IERC20 {
    string public constant name = "Peace Token";
    string public constant symbol = "PEACE";
    uint8 public constant decimals = 18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion Cap

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    address public protocolAddress;
    address public owner;

    event ProtocolUpdated(address indexed newProtocol);

    modifier onlyProtocol() {
        require(msg.sender == protocolAddress, "Caller is not the protocol");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev 设置允许 Mint 代币的逻辑合约地址
     */
    function setProtocol(address _protocol) external onlyOwner {
        require(_protocol != address(0), "Invalid protocol address");
        protocolAddress = _protocol;
        emit ProtocolUpdated(_protocol);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address ownerAddress, address spender) external view override returns (uint256) {
        return _allowances[ownerAddress][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }
        return true;
    }

    /**
     * @dev 核心 Mint 函数，仅允许 Protocol 调用。
     *      经济模型：完全基于空投交互，无预留。
     */
    function mint(address to, uint256 amount) external onlyProtocol {
        require(_totalSupply + amount <= MAX_SUPPLY, "PeaceToken: Cap exceeded");
        _mint(to, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        // 全局状态更新：在并行 EVM 中这可能是瓶颈，但在标准 Solidity 中不可避免。
        // 部分链可能会优化此类聚合操作。
        _totalSupply += amount;
        
        // 局部状态更新：完全并行化
        _balances[account] += amount;
        
        emit Transfer(address(0), account, amount);
    }

    function _approve(address ownerAddress, address spender, uint256 amount) internal {
        require(ownerAddress != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[ownerAddress][spender] = amount;
        emit Approval(ownerAddress, spender, amount);
    }
}

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ----------------------------------------------------------------------------
// 4. 协议逻辑层合约 (Logic Layer)
// ----------------------------------------------------------------------------

/**
 * @title PeaceProtocol
 * @dev 核心业务逻辑，无状态（除了不可变的合约引用），处理冷却和奖励分发。
 *      该合约作为系统的入口点。
 */
contract PeaceProtocol is ReentrancyGuard {
    // 引用数据合约和代币合约
    PeaceData public immutable dataContract;
    PeaceToken public immutable tokenContract;

    // 常量定义
    uint256 public constant COOLDOWN_PERIOD = 12 hours;
    uint256 public constant BASE_REWARD = 1000 * 10**18;    // 基础奖励 1000 PEACE
    uint256 public constant MAX_STREAK_BONUS = 500 * 10**18;// 最大额外奖励 500 PEACE (总计最高 1500)
    uint256 public constant BONUS_PER_STREAK = 100 * 10**18;// 每次连续签到增加 100 PEACE
    uint256 public constant REFERRAL_BONUS_PERCENT = 10;    // 直推奖励 10% (基于基础奖励)
    
    // 空投额度上限 (假设总量的 50% 用于空投，剩余 50% 用于质押池，可根据实际经济模型调整)
    uint256 public constant AIRDROP_CAP = 500_000_000 * 10**18; 
    uint256 public totalAirdropped;

    // 探索池（质押池）相关
    address public stakingPoolAddress;
    
    // 交互费 (以 wei 为单位，对应 BNB)。假设 BNB=$600，0.5U 约等于 0.00083 BNB。可由管理员调节。
    uint256 public interactionFee = 0.0008 ether; 

    address public feeReceiver1; // 接收交互费用的地址 1
    address public feeReceiver2; // 接收交互费用的地址 2
    address public owner;

    // 事件标准：结构化 SyncAction 事件
    event SyncAction(
        address indexed user,
        address indexed referrer,
        uint256 timestamp,
        uint256 rewardAmount,
        uint256 currentStreak
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(address _dataContract, address _tokenContract, address _feeReceiver1, address _feeReceiver2) {
        require(_dataContract != address(0), "Invalid data contract address");
        require(_tokenContract != address(0), "Invalid token contract address");
        require(_feeReceiver1 != address(0), "Invalid fee receiver 1 address");
        require(_feeReceiver2 != address(0), "Invalid fee receiver 2 address");
        
        dataContract = PeaceData(_dataContract);
        tokenContract = PeaceToken(_tokenContract);
        feeReceiver1 = _feeReceiver1;
        feeReceiver2 = _feeReceiver2;
        owner = msg.sender;
    }

    /**
     * @dev 设置探索池 (质押池) 地址
     */
    function setStakingPool(address _stakingPool) external onlyOwner {
        require(_stakingPool != address(0), "Invalid staking pool address");
        stakingPoolAddress = _stakingPool;
    }

    /**
     * @dev 提取剩余代币到探索池
     *      管理员可以在空投阶段结束后调用此函数，将剩余的所有 PEACE 铸造并发送到探索池。
     */
    function transferRemainingToStakingPool() external onlyOwner {
        require(stakingPoolAddress != address(0), "Staking pool not set");
        uint256 currentSupply = tokenContract.totalSupply();
        uint256 remainingSupply = tokenContract.MAX_SUPPLY() - currentSupply;
        require(remainingSupply > 0, "No remaining tokens to transfer");
        
        // 铸造剩余代币并直接发送到质押池
        tokenContract.mint(stakingPoolAddress, remainingSupply);
    }

    /**
     * @dev 更新交互费用
     */
    function setInteractionFee(uint256 _newFee) external onlyOwner {
        interactionFee = _newFee;
    }

    /**
     * @dev 更新费用接收地址
     */
    function setFeeReceivers(address _newReceiver1, address _newReceiver2) external onlyOwner {
        require(_newReceiver1 != address(0) && _newReceiver2 != address(0), "Invalid address");
        feeReceiver1 = _newReceiver1;
        feeReceiver2 = _newReceiver2;
    }

    /**
     * @dev 获取某个时间戳所在的 UTC 0点的时间戳
     */
    function getStartOfDay(uint256 timestamp) public pure returns (uint256) {
        return timestamp - (timestamp % 1 days);
    }

    /**
     * @notice 用户交互函数
     * @dev 包含冷却检查和代币分发逻辑。加入 nonReentrant 防重入锁。
     * @param referrer 推荐人地址
     */
    function interact(address referrer) external payable virtual nonReentrant {
        // 1. 检查交互费 (BNB)
        require(msg.value >= interactionFee, "Insufficient interaction fee");
        
        // 2. 获取当前时间
        uint256 currentTime = block.timestamp;

        // 3. 检查冷却时间并计算 Streak (以 UTC 0点为结算基准)
        uint256 lastInteraction = dataContract.getLastInteraction(msg.sender);
        uint256 currentStreak = dataContract.getStreak(msg.sender);
        
        if (lastInteraction != 0) {
            // 强制 12 小时硬冷却
            require(
                currentTime >= lastInteraction + COOLDOWN_PERIOD,
                "Cool down active: Please wait 12 hours between interactions"
            );
            
            // 判断是否为新的一天 (UTC) 
            uint256 lastInteractionDay = getStartOfDay(lastInteraction);
            uint256 currentDay = getStartOfDay(currentTime);
            
            if (currentDay > lastInteractionDay) {
                if (currentDay - lastInteractionDay == 1 days) {
                    // 连续的第二天签到，Streak 增加
                    currentStreak += 1;
                } else {
                    // 间隔超过1天，断签，重置 Streak 为 1 (代表重新开始的第一天连签，虽然是当天第一次)
                    // 或者可以设为0。这里设定断签后重新从0开始积累。
                    currentStreak = 0; 
                }
            } else {
                 // 同一天内多次交互（前提是过了12小时冷却），不增加连签奖励，保持当前连签状态
                 // (例如：0点过1分交互一次，中午12点过2分交互第二次)
            }
        } else {
            // 第一次交互
            currentStreak = 0;
        }

        // 4. 计算最终奖励金额
        uint256 streakBonus = currentStreak * BONUS_PER_STREAK;
        if (streakBonus > MAX_STREAK_BONUS) {
            streakBonus = MAX_STREAK_BONUS;
        }
        uint256 userReward = BASE_REWARD + streakBonus;
        
        // 计算直推奖励 (基于基础奖励的 10%)
        uint256 referrerReward = 0;
        if (referrer != address(0) && referrer != msg.sender) {
            referrerReward = (BASE_REWARD * REFERRAL_BONUS_PERCENT) / 100;
        }

        uint256 totalMintAmount = userReward + referrerReward;

        // 检查空投池额度
        require(totalAirdropped + totalMintAmount <= AIRDROP_CAP, "Airdrop cap reached");

        // 5. 更新状态 (写操作)
        dataContract.setLastInteraction(msg.sender, currentTime);
        dataContract.setStreak(msg.sender, currentStreak);
        totalAirdropped += totalMintAmount;

        // 6. 分发代币 (写操作)
        tokenContract.mint(msg.sender, userReward);
        if (referrerReward > 0) {
            tokenContract.mint(referrer, referrerReward);
        }

        // 7. 转移交互费给两个收款地址 (平分)
        uint256 feeHalf = msg.value / 2;
        uint256 feeRemaining = msg.value - feeHalf; // 处理奇数 wei

        (bool success1, ) = feeReceiver1.call{value: feeHalf}("");
        require(success1, "Fee transfer to receiver 1 failed");

        (bool success2, ) = feeReceiver2.call{value: feeRemaining}("");
        require(success2, "Fee transfer to receiver 2 failed");

        // 8. 抛出事件
        emit SyncAction(msg.sender, referrer, currentTime, userReward, currentStreak);
    }
}
