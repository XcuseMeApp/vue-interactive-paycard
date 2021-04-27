import Vue from 'vue'
import Card from './components/Card.vue'
import CardForm from './components/CardForm.vue'

const Components = {
  'card-visual': Card,
  'card-form': CardForm
}

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name])
})

export default Components
