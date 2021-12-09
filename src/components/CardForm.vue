<template>
  <div class="card-form">
    <div class="card-list">
      <Card
        dir="ltr"
        :fields="fields"
        :labels="formData"
        :isCardNumberMasked="isCardNumberMasked"
        :randomBackgrounds="randomBackgrounds"
        :backgroundImage="backgroundImage"
        :imageBaseUrl="imageBaseUrl"
      />
    </div>
    <form @submit="preventSubmit" method="post">
      <div class="card-form__inner">
        <div class="card-input">
          <label for="ccnumber" class="card-input__label">{{ $t("cardNumber") }}</label>
          <input
            dir="ltr"
            type="tel"
            id="ccnumber"
            name="ccnumber"
            autocomplete="cc-number"
            @input="changeNumber"
            @focus="focusCardNumber"
            @blur="blurCardNumber"
            class="card-input__input"
            :value="formData.cardNumber"
            :maxlength="cardNumberMaxLength"
            data-card-field
          />
          <!-- <button
            class="card-input__eye"
            :class="{ '-active' : !isCardNumberMasked }"
            title="Show/Hide card number"
            tabindex="-1"
            :disabled="formData.cardNumber === ''"
            @click="toggleMask"
          ></button> -->
        </div>

        <div class="card-input card-form__row">
          <div class="card-form__col card-form__row">
            <div class="card-form__group">
              <label for="cc-exp-month" class="card-input__label">{{ $t("expirationDate") }}</label>
              <select
                class="card-input__input -select"
                id="cc-exp-month"
                name="cc-exp-month"
                autocomplete="cc-exp-month"
                v-model="formData.cardMonth"
                @change="changeMonth"
                data-card-field

              >
                <option value disabled selected>{{ $t("mm") }}</option>
                <option
                  v-bind:value="n < 10 ? '0' + n : n"
                  v-for="n in 12"
                  v-bind:disabled="n < minCardMonth"
                  v-bind:key="n"
                >{{generateMonthValue(n)}}</option>
              </select>
              <select
                class="card-input__input -select"
                id="cc-exp-year"
                name="cc-exp-year"
                autocomplete="cc-exp-year"
                v-model="formData.cardYear"
                @change="changeYear"
                data-card-field
              >
                <option value disabled selected>{{ $t("yy") }}</option>
                <option
                  v-bind:value="$index + minCardYear"
                  v-for="(n, $index) in 12"
                  v-bind:key="n"
                >{{$index + minCardYear}}</option>
              </select>

            </div>
            <div v-if="visibleFields.includes('cvv2')" class="card-form__col -cvv">
              <label for="cvv2" class="card-input__label">{{ $t("cvv") }}</label>
              <input
                dir="ltr"
                type="tel"
                id="cvv2"
                name="cvv2"
                autocomplete="cc-csc"
                class="card-input__input"
                v-number-only
                maxlength="4"
                :value="formData.cardCvv"
                @input="changeCvv"
                data-card-field
              />
            </div>
          </div>
        </div>
        <div class="card-form__row">
          <div v-if="visibleFields.includes('nameoncard')" class="card-form__col -cardholder">
            <label for="nameoncard" class="card-input__label">{{ $t("nameOnCard") }}</label>
            <input
              dir="ltr"
              type="text"
              id="nameoncard"
              name="nameoncard"
              autocomplete="cc-name"
              v-letter-only
              @input="changeName"
              class="card-input__input"
              :value="formData.cardName"
              data-card-field
            />
          </div>
          <div v-if="visibleFields.includes('postal-code')" class="card-form__col -zip">
              <label for="postal-code" class="card-input__label">{{ $t("postalCode") }}</label>
              <input
                dir="ltr"
                type="tel"
                class="card-input__input"
                v-number-only
                id="postal-code"
                name="postal-code"
                autocomplete="postal-code"
                maxlength="5"
                :value="formData.cardZipCode"
                @input="changeZipCode"
                data-card-field
              />
          </div>
          <div v-if="visibleFields.includes('gov-id')" class="card-form__col -zip">
            <label for="gov-id" class="card-input__label">{{ $t("govId") }}</label>
            <input
              dir="ltr"
              type="tel"
              class="card-input__input"
              v-number-only
              id="gov-id"
              name="gov-id"
              autocomplete="gov-id"
              :value="formData.cardGovId"
              @input="changeGovId"
              data-card-field
            />
          </div>
        </div>
        <button class="card-form__button" @click="submitCard">
          <div class="row justify-center items-center">
          <img :src="`${imageBaseUrl}/lock-white-small.png`" class="q-mr-xs" />
          <span>{{ total ? `${$t("pay")} ${formattedTotal}` : $t("submitC") }}</span>
          </div>
        </button>
        <div class="row items-top justify-between q-mt-sm" dir="ltr">
          <div class="col-auto">
            <img
              id="trustwaveSealImage"
              src="https://sealserver.trustwave.com/seal_image.php?customerId=0a1e32ae5fdf4a4ea59b34d665c3a207&style=invert"
              border="0"
              style="cursor:pointer; height: 40px"
              class="col"
              onclick="javascript:window.open('https://sealserver.trustwave.com/cert.php?customerId=0a1e32ae5fdf4a4ea59b34d665c3a207&size=105x54&style=invert', 'c_TW', 'location=no, toolbar=no, resizable=yes, scrollbars=yes, directories=no, status=no, width=615, height=720'); return false;"
              oncontextmenu="javascript:alert('Copying Prohibited by Law - Trusted Commerce is a Service Mark of TrustWave Holdings, Inc.'); return false;"
              alt="This site is protected by Trustwave's Trusted Commerce program"
              title="This site is protected by Trustwave's Trusted Commerce program"
            />
          </div>
          <div class="col q-ml-md">
            <img :src="`${imageBaseUrl}/${poweredBy}`" style="" class="col" />
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import Card from './Card'
  import {
    isValid,
    isExpirationDateValid,
    isSecurityCodeValid,
    getCreditCardNameByNumber
  } from 'creditcard.js';
export default {
  name: 'CardForm',
  directives: {
    'number-only': {
      bind (el) {
        function checkValue (event) {
          event.target.value = event.target.value.replace(/[^0-9]/g, '')
          if (event.charCode >= 48 && event.charCode <= 57) {
            return true
          }
          event.preventDefault()
        }
        el.addEventListener('keypress', checkValue)
      }
    },
    'letter-only': {
      bind (el) {
        function checkValue (event) {
          if (event.charCode >= 48 && event.charCode <= 57) {
            event.preventDefault()
          }
          return true
        }
        el.addEventListener('keypress', checkValue)
      }
    }
  },
  props: {
    formData: {
      type: Object,
      default: () => {
        return {
          cardName: '',
          cardNumber: '',
          cardMonth: '',
          cardYear: '',
          cardCvv: '',
          cardZipCode: '',
          cardGovId: ''
        }
      }
    },
    backgroundImage: [String, Object],
    randomBackgrounds: {
      type: Boolean,
      default: true
    },
    imageBaseUrl: {
      type: String,
      default: "../assets/images"
    },
    total: {
      type: Number,
      default: 0
    },
    formattedTotal: {
      type: String,
      default: ""
    },
    poweredBy: {
      type: String,
      default: ""
    },
    visibleFields: {
      type: Array,
      default: () => [
        "ccnumber",
        "nameoncard",
        "cc-exp-month",
        "cc-exp-year",
        "cvv2",
        "postal-code"
      ]
    }
  },
  components: {
    Card
  },
  data () {
    return {
      fields: {
        cardNumber: 'ccnumber',
        cardName: 'nameoncard',
        cardMonth: 'cc-exp-month',
        cardYear: 'cc-exp-year',
        cardCvv: 'cvv2',
        cardZipCode: 'postal-code',
        cardGovId: 'gov-id'
      },
      minCardYear: new Date().getFullYear(),
      isCardNumberMasked: true,
      mainCardNumber: this.cardNumber,
      cardNumberMaxLength: 19
    }
  },
  computed: {
    minCardMonth () {
      if (this.formData.cardYear === this.minCardYear) return new Date().getMonth() + 1
      return 1
    }
  },
  watch: {
    cardYear () {
      if (this.formData.cardMonth < this.minCardMonth) {
        this.formData.cardMonth = ''
      }
    }
  },

  methods: {
    preventSubmit(event) {
      event.preventDefault()
    },

    generateMonthValue (n) {
      return n < 10 ? `0${n}` : n
    },
    changeName (e) {
      this.formData.cardName = e.target.value
      this.$emit('input-card-name', this.formData.cardName)
    },
    changeNumber (e) {
      if (`${e.target.value} `===this.formData.cardNumber) {
        // remove one extra digit from e
        this.formData.cardNumber = e.target.value.slice(0, e.target.value.length-1)
      } else {
        this.formData.cardNumber = e.target.value
      }

      let value = this.formData.cardNumber.replace(/\D/g, '')

      // american express, 15 digits
      if ((/^3[47]\d{0,13}$/).test(value)) {
        this.formData.cardNumber = value.replace(/(\d{4})/, '$1 ').replace(/(\d{4}) (\d{6})/, '$1 $2 ')
        this.cardNumberMaxLength = 17
      } else if ((/^3(?:0[0-5]|[68]\d)\d{0,11}$/).test(value)) { // diner's club, 14 digits
        this.formData.cardNumber = value.replace(/(\d{4})/, '$1 ').replace(/(\d{4}) (\d{6})/, '$1 $2 ')
        this.cardNumberMaxLength = 16
      } else if ((/^\d{0,16}$/).test(value)) { // regular cc number, 16 digits
        this.formData.cardNumber = value.replace(/(\d{4})/, '$1 ').replace(/(\d{4}) (\d{4})/, '$1 $2 ').replace(/(\d{4}) (\d{4}) (\d{4})/, '$1 $2 $3 ')
        this.cardNumberMaxLength = 19
      }
      this.$emit('input-card-number', this.formData.cardNumber)
    },
    changeMonth () {
      this.$emit('input-card-month', this.formData.cardMonth)
    },
    changeYear () {
      this.$emit('input-card-year', this.formData.cardYear)
    },
    changeCvv (e) {
      this.formData.cardCvv = e.target.value
      this.$emit('input-card-cvv', this.formData.cardCvv)
    },
    changeZipCode (e) {
      this.formData.cardZipCode = e.target.value
      this.$emit('input-card-zipcode', this.formData.cardZipCode)
    },
    changeGovId (e) {
      this.formData.cardGovId = e.target.value
      this.$emit('input-card-id', this.formData.cardGovId)
    },
    areAllFieldsPresent() {
      return Object.keys(this.fields).reduce((acc, key)=> {
        return acc && (this.formData[key] || !this.visibleFields.includes(this.fields[key]))
      }, true)
    },

    submitCard () {
      if (!this.areAllFieldsPresent()) {
        this.$emit('error', { title: this.$t("ooops"), message: this.$t("allFieldsAreRequired")})
      } else if (!isValid(this.formData.cardNumber)) {
        this.$emit('error', { title: this.$t("cardNumberIsInvalid"), message: this.$t("pleaseCheckYourInputOrTryAnotherCard")})
      } else if (!isExpirationDateValid(this.formData.cardMonth, this.formData.cardYear.toString())) {
        this.$emit('error', { title: this.$t("cardHasExpired"), message: this.$t("pleaseCorrectExpirationOrTryAnotherCard")})
      } else if (this.visibleFields.includes("cvv2") && !isSecurityCodeValid(this.formData.cardNumber, this.formData.cardCvv)) {
        this.$emit('error', { title: this.$t("cardSecurityCodeIsInvalid"), message: this.$t("pleaseCheckThatYouEnteredItCorrectlyAndTryAgain")})
      } else if (this.visibleFields.includes("postal-code") && this.formData.cardZipCode.length!==5) {
        this.$emit('error', { title: this.$t("invalidPostalCode"), message: this.$t("reenterAndTryAgain")})
      } else {
        this.$emit('validated')
      }
    },
    blurCardNumber () {
      // if (this.isCardNumberMasked) {
      //   this.maskCardNumber()
      // }
    },
    maskCardNumber () {
      // this.mainCardNumber = this.formData.cardNumber
      // let arr = this.formData.cardNumber.split('')
      // arr.forEach((element, index) => {
      //   if (index > 4 && index < 14 && element.trim() !== '') {
      //     arr[index] = '*'
      //   }
      // })
      // this.formData.cardNumber = arr.join('')
    },
    unMaskCardNumber () {
      // this.formData.cardNumber = this.mainCardNumber
    },
    focusCardNumber () {
      // this.unMaskCardNumber()
    },
    toggleMask () {
      // this.isCardNumberMasked = !this.isCardNumberMasked
      // if (this.isCardNumberMasked) {
      //   this.maskCardNumber()
      // } else {
      //   this.unMaskCardNumber()
      // }
    }
  },
  mounted () {
    // this.maskCardNumber()
  }
}
</script>
