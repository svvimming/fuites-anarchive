import { rollDice } from '../scripts/dice'
import wordlist from '../scripts/wordlist.json'

export default defineNuxtPlugin({
  name: 'diceware',
  setup () {
    return {
      provide: {
        diceware: async (numWords = 3) => {
          const words = await Promise.all(
            Array(numWords).fill().map(async () => {
              const data = await rollDice(5)
              const roll = data.roll.join('')
              return wordlist[roll]
            })
          )
          return words.join('-')
        }
      }
    }
  }
})
