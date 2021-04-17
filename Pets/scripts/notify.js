let notify = (() => {
    $(document).on({
      ajaxStart: () => $('#loadingBox').show(),
      ajaxStop: () => $('#loadingBox').fadeOut()
    })
    function showInfo (message) {
      let infoBox = $('#successBox')
      infoBox.find('span').text(message)
      infoBox.fadeIn()
      setTimeout(() => infoBox.fadeOut(), 15000)
    }
  
    function showError(message) {
      let errorBox = $('#errorBox')
      errorBox.find('span').text(message)
      errorBox.fadeIn()
      setTimeout(() => errorBox.fadeOut(), 3000)
    }
  
    function handleError (reason) {
      showError(reason.responseJSON.description)
    }
  
    return {
      showInfo,
      showError,
      handleError
    }
  })()
  