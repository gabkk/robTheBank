pragma solidity ^0.5.0;

contract CoinFlip {
    address owner;
    mapping (address => bool) lastFlip;
    mapping (address => uint256) userBalance;

    event resultOfFlip(string result);
    event calculOfRandom(uint timestamp, uint difficulty, uint result);

    constructor() public payable{
        owner = msg.sender;

        // User address
	    userBalance[msg.sender] = 0;

	    // Contract address
	    userBalance[address(this)] = msg.value;
    	lastFlip[msg.sender] = false;
    }

    modifier onlyOwner{
    	require(owner == msg.sender);
    	_;
    }

    function getContract() view public returns(uint){
        return address(this).balance;
    }

    function getBankBalance() view public returns(uint){
        return userBalance[address(this)];
    }

    function getUserBalance(address player) view public returns(uint){
        return userBalance[player];
    }

    function getLastFlip(address player) view public returns(bool){
        return lastFlip[player];
    }

    function random() private returns (uint8) {
       uint8 result = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)))%251); 
	   emit calculOfRandom(block.timestamp, block.difficulty, result);
       return result;
   }

    //	NEED TO SECURE THIS
    //	error -1 user balance insuffisant
    //	error -2 user bet could't be null
    //	error -3 Contract address don't have enought found to pay the user

    function flip() payable public{
    	require(userBalance[msg.sender] >= msg.value, "-1");
    	require(msg.value > 0, "-2");
    	uint256 jackpotValue = msg.value * 2;
    	require(userBalance[address(this)] >= jackpotValue, "-3");
        uint randomResult = random();
        uint bet = msg.value;

        if(randomResult % 2 == 0){
        	userBalance[msg.sender] += jackpotValue;
            userBalance[address(this)] -= jackpotValue;
            lastFlip[msg.sender] = true;
    	    emit resultOfFlip("gagne");
        } else {
        	userBalance[msg.sender] -= msg.value;
            userBalance[address(this)] += msg.value;
            lastFlip[msg.sender] = false;
	        emit resultOfFlip("perd");
        }
    }

    function playerWithdraw(address player) public{
    	require(msg.sender == player);
        msg.sender.transfer(userBalance[player]);
    }

    function sendMoneyToTheBank() payable public{
    	userBalance[address(this)] += msg.value;
    }

    function sendMoneyToThePlayer() payable public{
    	userBalance[msg.sender] += msg.value;
    }
}