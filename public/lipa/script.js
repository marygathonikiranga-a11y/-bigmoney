document.addEventListener('DOMContentLoaded', function () {

  const payButton =
    document.getElementById('payButton');

  const amountInput =
    document.getElementById('amount');

  const displayAmount =
    document.getElementById('displayAmount');

  const urlParams = new URLSearchParams(window.location.search);
  const presetAmount = urlParams.get('amount');
  if (presetAmount && !isNaN(Number(presetAmount))) {
    amountInput.value = presetAmount;
    displayAmount.textContent = `KES ${presetAmount}`;
  }

  // Live amount display
  amountInput.addEventListener('input', function () {

    const value = amountInput.value || 0;

    displayAmount.textContent =
      `KES ${value}`;

  });

  payButton.addEventListener(
    'click',
    payWithPaystack
  );

  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      window.location.href = '/#/dashboard';
    });
  }

  function payWithPaystack() {

    const amountValue =
      amountInput.value;

    // Validation
    if (
      !amountValue ||
      amountValue <= 0
    ) {

      alert(
        'Please enter a valid deposit amount.'
      );

      return;
    }

    // Convert to smallest currency unit
    const amount =
      amountValue * 100;

    const ref =
      'DEP_' + Date.now();

    const handler =
      PaystackPop.setup({

        key:
          'pk_live_e3b870b2bb32b55353ac1f5484eabd8f0dc9b6c5',

        email:
          'customer@tradex.com',

        amount: amount,

        currency: 'KES',

        ref: ref,

        label:
          'TradeX Deposit',

        callback: function (
          response
        ) {

          alert(
            `Payment successful!\nReference: ${response.reference}`
          );

          localStorage.setItem('mpesaDepositAmount', amountValue);
          window.location.href = '/dashboard';

          console.log(
            'Payment success:',
            response
          );

        },

        onClose: function () {

          alert(
            'Payment window closed.'
          );

        }

      });

    handler.openIframe();

  }

});
