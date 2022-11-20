const aumi = require("./api/aumi.json");
const aumi_vault = require("./api/aumi-stake.json");

exports.Abis = {
    aumi: {
        abi: aumi,
        address: "0x3eb177a6693ec81d1e170136f8ad02fffbe172a7"
    },
    vault: {
        abi: aumi_vault,
        address: "0x82AeCa6D5fDAC30DEAE7D278aab2E70a7AC05193"
    }
}