export interface Testimonial {
  id:     string
  name:   string
  role:   string
  avatar: string
  quote:  string
}

export const testimonials: Testimonial[] = [
  { id: '1', name: 'Sarah K.', role: 'Senior Backend Engineer', avatar: 'SK', quote: 'DBForge cut our schema design time by 80%. The AI generation is eerily accurate.' },
  { id: '2', name: 'Marcus T.', role: 'CTO, StartupFlow', avatar: 'MT', quote: 'Finally, a tool that speaks developer. The ER visualizer alone is worth it.' },
  { id: '3', name: 'Priya N.', role: 'Full-Stack Developer', avatar: 'PN', quote: 'I use DBForge every day. The query editor with AI suggestions is a game changer.' },
]
