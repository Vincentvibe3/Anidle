class Compare{

    constructor (s1, s2){
        this.s1 = s1
        this.s2 = s2
    }

    getLengthScore() {
        return 1/(Math.abs(this.s1.length-this.s2.length)+1)
    }

    getScore(){
        let score = this.getLengthScore()
        return score
    }
}

console.log(new Compare("1", "bacd").getScore())