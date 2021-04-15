let notify = (() => {
    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').fadeOut()
    })
    function showSuccess(message) {
        let success = $('#success')
        success.find('span').text(message)
        success.fadeIn()
        setTimeout(() => success.fadeOut(), 3000)
    }

    function showError(message) {
        let error = $('#error')
        error.find('span').text(message)
        error.fadeIn()
        setTimeout(() => error.fadeOut(), 3000)
    }

    function handleError(reason) {
        showError(reason.responseJSON.description)
    }

    return {
        showSuccess,
        showError,
        handleError
    }
})();