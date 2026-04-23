Bug: Checkbox-State beim Paste verloren
=======================================

Beim Kopieren aus Confluence werden abgehakte Todos als `[ ]` gerendert.

Schritte zur Reproduktion
-------------------------

1.  Confluence-Seite mit Task-Liste öffnen2.  Text markieren, kopieren3.  In [clipboard2markdown](https://michaelstingl.github.io/clipboard2markdown/) einfügen

Erwartetes Verhalten
--------------------

```markdown
- [x] Ein erledigter Todo
- [ ] Ein offener Todo
```

Siehe auch ~~alte Version~~ **neue Version** im Repo.