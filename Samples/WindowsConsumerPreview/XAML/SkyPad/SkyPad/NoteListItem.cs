using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SkyPad
{
    class NoteListItem
    {
        public String id;
        public String type;

        public NoteListItem(String id, String type)
        {
            this.id = id;
            this.type = type;
        }
    }
}
