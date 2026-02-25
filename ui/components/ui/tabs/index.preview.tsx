// Auto-generated preview. Customize by editing this file.

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'

export function Default() {
  const [activeTab, setActiveTab] = useState('account')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="account" selected={activeTab === 'account'} onClick={() => setActiveTab('account')}>
          Account
        </TabsTrigger>
        <TabsTrigger value="password" selected={activeTab === 'password'} onClick={() => setActiveTab('password')}>
          Password
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" selected={activeTab === 'account'}>
        Account settings here
      </TabsContent>
      <TabsContent value="password" selected={activeTab === 'password'}>
        Password settings here
      </TabsContent>
    </Tabs>
  )
}

