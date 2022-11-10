const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

async function main() {
    const [buyer, seller, inspector, lender] = await ethers.getSigners()
    const RealEstate = await ethers.getContractFactory("RealEstate")
    const realEstate = await RealEstate.deploy()
    await realEstate.deployed()

    console.log(`Deployed Real Estate Contract at: ${realEstate.address}`)
    console.log(`Minting 3 properties...\n`)

    for (let i = 0; i < 3; i++) {
        const transaction = await realEstate
            .connect(seller)
            .mint(
                `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`
            )
        await transaction.wait()
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(realEstate.address, args)
    }

    console.log("----------------------------------")

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow")
    const escrow = await Escrow.deploy(
        realEstate.address,
        seller.address,
        inspector.address,
        lender.address
    )
    await escrow.deployed()

    console.log(`Deployed Escrow Contract at: ${escrow.address}`)
    console.log(`Listing 3 properties...\n`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(escrow.address, args)
    }

    for (let i = 0; i < 3; i++) {
        // Approve properties...
        let transaction = await realEstate.connect(seller).approve(escrow.address, i + 1)
        await transaction.wait()
    }

    // Listing properties...
    transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
    await transaction.wait()

    console.log(`Finished.`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})