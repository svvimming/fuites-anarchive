// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useCreatePageFromThingie = () => {
  // ====================================================================== Data
  const collectorStore = useCollectorStore()
  const verseStore = useVerseStore()
  const { page } = storeToRefs(verseStore)
  const pocketStore = usePocketStore()
  const { pocket } = storeToRefs(pocketStore)

  // =================================================================== Methods
   /**
   * @method createNewPageFromThingie
   */

   const createNewPageFromThingie = async (thingie, newAt) => {
    console.log('createNewPageFromThingie composable', 'thingie', thingie, 'newAt', newAt)
    const created = await verseStore.postCreatePage({
      initiatorPocket: pocket.value.data._id,
      creatorThingie: thingie,
      overflowPage: page.value.data.name
    })
    if (created) {
      collectorStore.initThingieUpdate({
        _id: thingie._id,
        location: created.name,
        record_new_location: true,
        at: newAt
      }, true)
      // Navigate to new page
      const newRoute = `/${created.verse}/${created.name}`
      await navigateTo({ path: newRoute })
    }
  }

  return {
    createNewPageFromThingie
  }
}
