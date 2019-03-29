pragma solidity ^0.5.0;

contract CoinFlip {
    address owner;
    mapping (address => bool) lastFlip;

    event resultOfFlip(string result);
    event calculOfRandom(uint timestamp, uint difficulty, uint result);

    constructor() public {
        owner = msg.sender;
    }

    function getBalance() view public returns(uint){
        return address(this).balance;
    }

    function getLastFlip(address player) view public returns(bool){
        return lastFlip[player];
    }

    function random() private returns (uint8) {
       uint8 result = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)))%251); 
	   emit calculOfRandom(block.timestamp, block.difficulty, result);
       return result;
   }

    //   NEED TO SECURE THIS
    function flip() payable public{
        uint time = random();
        uint bet = msg.value;

        if(time % 2 == 0){
            msg.sender.transfer(bet*2);
            lastFlip[msg.sender] = true;
    	    emit resultOfFlip("gagne");
        } else {
            lastFlip[msg.sender] = false;
	        emit resultOfFlip("perd");
        }
    }

    function deposit() payable public{

    }
}