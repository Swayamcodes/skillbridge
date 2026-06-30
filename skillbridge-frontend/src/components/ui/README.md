# SkillBridge UI Primitives

Use these components for new page redesigns so styling stays consistent with the SkillBridge design system.

```jsx
import {
  Badge,
  Card,
  EmptyState,
  FormField,
  LoadingIndicator,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  SelectInput,
  StatCard,
  Textarea,
  TextInput,
} from '../components/ui';
```

## Components

- `PrimaryButton`, `SecondaryButton`, and `Button` cover primary, secondary, ghost, and danger actions.
- `TextInput`, `SelectInput`, and `Textarea` share focus, spacing, disabled, and placeholder styles.
- `Card` provides the default app surface, with optional `hover` and `padded` props.
- `SectionHeader` standardizes eyebrow, title, description, and right-side actions.
- `StatCard` standardizes metric blocks.
- `Badge` supports `neutral`, `emerald`, `dark`, `amber`, `red`, and `blue` variants.
- `EmptyState` gives consistent empty-result panels with optional icon and action.
- `LoadingIndicator` gives a consistent spinner and loading label.

Matching class utilities live in `src/index.css` under the `.ui-*` naming convention for cases where direct class composition is simpler.
