const importDataContractABI1 = (pathStr) => {
  // need to specify part of path here because of https://github.com/webpack/webpack/issues/4921#issuecomment-357147299
  const importFile = require(`../../data-contracts/ABIs/${pathStr}`)

  if (importFile) return importFile
  else throw new Error(`Data contract ABI not found ${pathStr}`)
}

const importEthContractABI1 = (pathStr) => {
  // need to specify part of path here because of https://github.com/webpack/webpack/issues/4921#issuecomment-357147299
  const importFile = require(`../../eth-contracts/ABIs/${pathStr}`)

  if (importFile) return importFile
  else throw new Error(`Eth contract ABI not found ${pathStr}`)
}

module.exports = {
  importDataContractABI: importDataContractABI1, importEthContractABI: importEthContractABI1
}
