let notify = (() => {
    $(document).on({
        ajaxStart: () => $('#loadingNotification').show(),
        ajaxStop: () => $('#loadingNotification').fadeOut()
    })
    function showSuccess(message) {
        let success = $('#successNotification')
        success.find('span').text(message)
        success.fadeIn()
        setTimeout(() => success.fadeOut(), 5000)
    }

    function showError(message) {
        let error = $('#errorNotification')
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