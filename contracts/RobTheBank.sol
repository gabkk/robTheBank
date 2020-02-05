pragma solidity ^0.5.0;

import '../client/node_modules/@openzeppelin/contracts/math/SafeMath.sol';
import '../client/node_modules/@openzeppelin/contracts/drafts/SignedSafeMath.sol';
import './provableAPI.sol';



// Import SafeMath library from github (this import only works on Remix).
// import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/drafts/SignedSafeMath.sol";
// import "github.com/oraclize/ethereum-api/provableAPI.sol";


contract RobTheBank is usingProvable{

	using SafeMath for uint256;
	using SignedSafeMath for int256;

    struct RobberState{
        bool isAllowToPlay;
        bool userKnownByTheContract;
        bytes32 queryId;
    }

    struct UserInfo{
        address payable userAddr;
        address bankAddr;
        uint256 value;
        bool status;
    }

	mapping (address => RobberState) private RobberInfo;
	mapping (bytes32 => UserInfo) private pendingQueries;

	address public owner;

    uint256 internal constant MAX_INT_FROM_BYTE = 256;
    uint256 internal constant NUM_RANDOM_BYTES_REQUESTED = 1;

	event ReturnValue(address _sender, uint256 _randomNumber, bool _value);
	event ReturnValue(bytes32 _queryId, uint256 _randomNumber, bool _value);

    /*
    * Oracle events
    */
    event proofFailed(string description);
    event LogNewProvableQuery(string description, bytes32 _queryId);
    event generatedRandomNumber(uint256 randomNumber);

    struct Bank {
        string name;
        uint256 balance;
        bool isCreated;
        bool usingOracle;
    }

    mapping (address => int256) private userHistory;
	mapping(address => Bank) private Banks;
    address[] public listOfBank;

    event LogListOfBank(string name, address addr, uint256 balance);

	/* Move Modifier to an other file*/

	constructor() public payable{
		require(msg.value >= 0.1 ether);
		owner = msg.sender;

		setBanks(msg.value, "FED", true, true);
		setListOfBank(msg.sender);
		emit LogListOfBank("FED", msg.sender, msg.value);
	}

	// add name to the bank Struct
	function createBank(string memory _name, bool _isUsingOracle) public payable{
		require(Banks[msg.sender].isCreated == false, "You can only own one bank");
		require(bytes(_name).length < 21);
		require(bytes(_name).length > 0);
		require(msg.value >= 0.1 ether);
        setBanks(msg.value, _name, true, _isUsingOracle);
		setListOfBank(msg.sender);
		emit LogListOfBank(_name, msg.sender, msg.value);
	}

    function setBanks(uint256 _balance,
                      string memory _name,
                      bool _isCreated,
                      bool usingOracle)
                      private {
		Banks[msg.sender].balance = _balance;
		Banks[msg.sender].name = _name;
		Banks[msg.sender].isCreated = _isCreated;
		Banks[msg.sender].usingOracle = usingOracle;
    }

    function setListOfBank(address _sender) private{
        listOfBank.push(_sender);
    }
		
    function getBankLength() view public returns(uint256){
		return listOfBank.length;
	}

	function getListOfBank() view public returns(address[] memory){
		return listOfBank;
	}

	/* Todo test view */
	function getListOfBankObj() public {
		for(uint i=0; i < listOfBank.length; i++){
			emit LogListOfBank(
			        getBankName(listOfBank[i]),
			        listOfBank[i],
			        getBankBalance(listOfBank[i])
			     );
		}
	}

	function getBankBalance(address _bankAddr) view public returns(uint256){
		return Banks[_bankAddr].balance;
	}

	function getBankName(address _bankAddr) view public returns(string memory){
		return Banks[_bankAddr].name;
	}

	function getBankInfos(address _bankAddr) view public returns(string memory, uint256, bool,bool){
		Bank memory p = Banks[_bankAddr];
		return (p.name, p.balance, p.isCreated, p.usingOracle);
	}

	// Get the balance of the user
	function getUserHistory(address player) view public returns(int256){
		return userHistory[player];
	}

    function sendMoneyToTheBank() public payable {
        require(msg.value > 0 ether, "msg.value can't 0");
		require(Banks[msg.sender].isCreated == true, "You don't have a bank yet");

		Banks[msg.sender].balance = Banks[msg.sender].balance.add(msg.value);
	}

	function isBankOwner(address _myCall) public view returns (bool){
		if (Banks[_myCall].isCreated == true)
			return true;
		return false;
	}

	function withdrawBankAccount() public payable {
	    require(Banks[msg.sender].isCreated == true, "Bank doesn't exist");
		require(Banks[msg.sender].balance != 0);
		uint value = Banks[msg.sender].balance;
		Banks[msg.sender].balance = 0;
		msg.sender.transfer(value);
	}

    function getCurrentOraclePrice() payable public returns(uint price){
        price = provable_getPrice("Random");
        return price;
    }

    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        require(pendingQueries[_queryId].status);
        require(msg.sender == provable_cbAddress());
        if (
            provable_randomDS_proofVerify__returnCode(
                _queryId,
                _result,
                _proof
            ) != 0
        ) {
            emit proofFailed("The proof verification failed in the callback");
        } else {
            uint256 ceiling = (MAX_INT_FROM_BYTE ** NUM_RANDOM_BYTES_REQUESTED) - 1;
            uint256 firstRes = uint256(keccak256(abi.encodePacked(_result))) % ceiling;
            uint8 result = uint8(firstRes.mod(251));

            bool flipStatus = flipProcessResult(result, _queryId);
            emit ReturnValue(_queryId, result, flipStatus);
            address userAddr =  pendingQueries[_queryId].userAddr;
            RobberInfo[userAddr].isAllowToPlay = true;
            delete pendingQueries[_queryId];
        }
    }

    function _oracleRandom(address _bankAddr) private{
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        bytes32 _queryId =  provable_newRandomDSQuery(
                                QUERY_EXECUTION_DELAY,
                                NUM_RANDOM_BYTES_REQUESTED,
                                GAS_FOR_CALLBACK
                            );
        pendingQueries[_queryId].status = true;
        pendingQueries[_queryId].userAddr = msg.sender;
        pendingQueries[_queryId].value = msg.value;
        pendingQueries[_queryId].bankAddr = _bankAddr;
        RobberInfo[msg.sender].queryId = _queryId;
        emit LogNewProvableQuery("Provable query was sent, standing by for the answer...", _queryId);
        
    }

	/*
	* As the timestamp can be control by the miner we need to set
	* a max limit per bet in the flip function.
	*/
	function _pseudoRandom() private view returns (uint8) {
		uint256 firstRes = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
		uint8 result = uint8(firstRes.mod(251));
		return result;
	}

    /*
    *   This function will be called by the standards method
    */
    function flipProcessResult(uint8 _randomNumber, address _bankAddr) private returns(bool){
        bool flipStatus;
        
        //TODO ternaire
        if(_randomNumber % 2 == 0){
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.sub(msg.value);
			msg.sender.transfer(msg.value.mul(2));
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[msg.sender] = userHistory[msg.sender].add(int256(msg.value));
			flipStatus = true;
        } else {
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.add(msg.value);
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[msg.sender] = userHistory[msg.sender].sub(int256(msg.value));
		    flipStatus = false;
		}
		emit ReturnValue(msg.sender, _randomNumber, flipStatus);
        return flipStatus;
    }

    /*
    *   This function will be called by the oracle
    */
    function flipProcessResult(uint8 _randomNumber, bytes32 _queryId) private returns(bool){
        bool flipStatus;
        address payable _usrAddr = pendingQueries[_queryId].userAddr;
        address _bankAddr = pendingQueries[_queryId].bankAddr;
        uint256 _value = pendingQueries[_queryId].value;

        if(_randomNumber % 2 == 0){
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.sub(_value);
			_usrAddr.transfer(msg.value.mul(2));
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[_usrAddr] = userHistory[_usrAddr].add(int256(_value));
			flipStatus = true;
		} else {
			Banks[_bankAddr].balance = Banks[_bankAddr].balance.add(_value);
			// Not really safe to cast but the value is high enought to be a problem
			userHistory[_usrAddr] = userHistory[_usrAddr].sub(int256(_value));
		    flipStatus = false;
		}
        return flipStatus;
    }

	function flip(address _bankAddr, bool _isBankUsingOracle) public payable{
		// TODO remove this just need to check than we get money to pay the oracle fee
		require(msg.value < 10 ether, "bet should be less than 10 eth");
		require(msg.value >= 0.01 ether, "bet should more than 0.01 eth");

        // Check if the player is still waiting for a responce from a previous game
        if(RobberInfo[msg.sender].userKnownByTheContract == false){
            RobberInfo[msg.sender].userKnownByTheContract = true;
            RobberInfo[msg.sender].isAllowToPlay = true;
        }
        require(RobberInfo[msg.sender].isAllowToPlay == true,
                "User is still waiting for the random function to be process");
        RobberInfo[msg.sender].isAllowToPlay = false;

        // Use a different function regarding if the bank is using an oracle or not
        if (_isBankUsingOracle == true){
    	    _oracleRandom(_bankAddr);
        } else {
		    uint8 randomResult = _pseudoRandom();
            flipProcessResult(randomResult, _bankAddr);
    		RobberInfo[msg.sender].isAllowToPlay = true;
        }
	}

	function destroyContract() public payable {
	    require(owner == msg.sender);
		selfdestruct(msg.sender);
	}
}