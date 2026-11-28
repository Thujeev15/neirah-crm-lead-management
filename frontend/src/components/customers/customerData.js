// Customer data assembled only from existing endpoints.
//
// The backend has no "list customers" endpoint. Customers are created from Won leads, and
// GET /leads/{id}/customer returns the customer a lead converted into (404 if it has not been
// converted). So the list is built by asking each Won lead the manager can see for its customer
// and grouping leads that share a customer ID (repeat deals link to one customer).
//
// The account owner is the owner of the lead the customer was created from (sourceLeadId):
// that is the same rule the backend uses to decide which customers a sales rep can see.

import api from '../../api/axios'
import { asList } from '../users/teamData'

const CONCURRENCY = 6

async function mapLimited(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = { ok: true, value: await fn(items[index]) }
      } catch (error) {
        results[index] = { ok: false, error }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function loadCustomers() {
  const leads = asList((await api.get('/leads')).data)
  const wonLeads = leads.filter((lead) => lead.status === 'WON')
  const results = await mapLimited(wonLeads, CONCURRENCY, (lead) => api.get(`/leads/${lead.id}/customer`))

  const leadById = new Map(leads.map((lead) => [lead.id, lead]))
  const customers = new Map()
  const unconverted = []
  let failed = 0

  results.forEach((result, index) => {
    const lead = wonLeads[index]
    if (!result.ok) {
      // 404 = Won but not converted yet. Anything else is a genuine failure.
      if (result.error?.response?.status === 404) unconverted.push(lead)
      else failed += 1
      return
    }
    const data = result.value.data
    if (!customers.has(data.customerId)) {
      const source = leadById.get(data.sourceLeadId) || lead
      customers.set(data.customerId, {
        id: data.customerId,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        convertedAt: data.convertedAt,
        sourceLeadId: data.sourceLeadId,
        ownerName: source.ownerName,
        ownerEmail: source.ownerEmail,
        source: source.source,
        leadCreatedAt: source.createdAt,
        deals: [],
      })
    }
    customers.get(data.customerId).deals.push(lead)
  })

  const list = [...customers.values()].map((customer) => ({
    ...customer,
    deals: customer.deals.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    wonValue: customer.deals.reduce((total, deal) => total + (Number(deal.dealValue) || 0), 0),
  }))

  if (failed && list.length === 0) {
    const error = new Error('Customer records could not be loaded.')
    error.partial = failed
    throw error
  }

  return { customers: list, unconverted, failed }
}

// Everything that happened on the customer's leads: notes/calls/meetings plus audit events.
export async function loadCustomerHistory(customer) {
  const leadIds = customer.deals.map((deal) => deal.id)
  const responses = await Promise.all(
    leadIds.flatMap((id) => [
      api.get(`/leads/${id}/activities`),
      api.get(`/leads/${id}/audit-logs`),
      api.get(`/leads/${id}/follow-ups`),
    ]),
  )

  const timeline = []
  const followUps = []
  leadIds.forEach((leadId, i) => {
    const [activities, audits, followUpsResponse] = responses.slice(i * 3, i * 3 + 3).map((r) => asList(r.data))
    activities.forEach((item) => timeline.push({ key: `a-${item.id}`, kind: 'activity', leadId, type: item.type, text: item.description, actor: item.actorName, at: item.createdAt }))
    audits.forEach((item) => timeline.push({ key: `e-${item.id}`, kind: 'audit', leadId, type: item.eventType, from: item.oldValue, to: item.newValue, actor: item.actorName, at: item.occurredAt }))
    followUpsResponse.forEach((item) => followUps.push(item))
  })

  timeline.sort((a, b) => new Date(b.at) - new Date(a.at))
  followUps.sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(a.dueAt) - new Date(b.dueAt))
  return { timeline, followUps }
}

// Same values the lead form offers (LeadForm.jsx).
export const SOURCE_LABELS = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  CALL: 'Phone call',
  CAMPAIGN: 'Marketing campaign',
  SOCIAL_MEDIA: 'Social media',
  OTHER: 'Other',
}

export function sourceLabel(source) {
  if (!source) return '—'
  return SOURCE_LABELS[source] || source.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
