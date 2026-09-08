# Keep Git as the canonical content store

Each Workspace's Native Content and revision history will live in a Content
Repository. Content changes are persisted as commits or pull requests rather
than into a canonical platform database, preserving auditability, portability,
and self-hosting at the cost of handling Git conflicts and asynchronous review
flows.
