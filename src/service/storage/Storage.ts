export class Storage {
    public circulatingSupply: string;
    public totalSupply: string;

    public decimal: number;

    constructor() {
        this.circulatingSupply = "2999041397367921";
        this.totalSupply = "4500000000000000";
        this.decimal = 7;
    }
}

const storage: Storage = new Storage();

export default storage;
