import { Music } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card'

import SongsTable from './SongsTable';
import AddSongDialog from './AddSongDialog';

export default function SongsTabContent() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="size-5 text-purple-400" />
              Songs Library
            </CardTitle>
            <CardDescription>Manage your music tracks</CardDescription>
          </div>
          <AddSongDialog />
        </div>
      </CardHeader>
      <CardContent>
        <SongsTable />
      </CardContent>
    </Card>
  )
}