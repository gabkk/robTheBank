var i = 0;
var j = 0;
var txt = 'Give a man a gun and he can rob a bank. ';
var txt2 = "Give a man a bank and he can rob the world. - jim-trotter";
var speed = 50; /* The speed/duration of the effect in milliseconds */

 function typeWriter(len, id, _txt){
  if (len < _txt.length) {
    document.getElementById(id).innerHTML += _txt.charAt(len);
    len++;
    setTimeout(() => typeWriter(len, id, _txt), speed);
  }
}

export const  displayRobQuote = () => {
	typeWriter(i, "RobText", txt);
	setTimeout(() => typeWriter(j, "RobText2", txt2), 3000);	
}

// export const loadingRobbering = (status) =>{
// 	if (i < 100 && status === true){
// 		let el = document.getElementById("loadingRobery");
// 		el.innerHTML = i + "%";
// 		el.style.width = i + "%"; 
// 		i++;
// 		setTimeout(() => loadingRobbering(status),500);
// 	}
// }

